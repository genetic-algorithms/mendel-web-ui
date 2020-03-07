package db

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"
	"time"

	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/mutils"
	"golang.org/x/crypto/bcrypt"
)

const (
	INITIAL_ADMIN_PW = "changeme!"
	//DB_DIR  = "./database"
	//DB_PATH = DB_DIR + "/database.json"
)

type DatabaseJob struct {
	Id          string    `json:"id"`
	Description string    `json:"description"` // this is cached in the db from the job config
	Time        time.Time `json:"time"`
	OwnerId     string    `json:"owner_id"`
	Status      string    `json:"status"` // running, cancelled, failed, succeeded
}

type DatabaseUser struct {
	Id       string `json:"id"`
	Username string `json:"username"`
	Password []byte `json:"password"`
	IsAdmin  bool   `json:"is_admin"`
}

type DatabaseData struct {
	Version        int                     `json:"version"`
	CookieHashKey  []byte                  `json:"cookie_hash_key"`
	CookieBlockKey []byte                  `json:"cookie_block_key"`
	Jobs           map[string]DatabaseJob  `json:"jobs"`
	Users          map[string]DatabaseUser `json:"users"`
}

type Database struct {
	Data DatabaseData
	//todo: this file descriptor is not valid in other go routine threads!!!!!!!!!!!
	//fileDesc        *os.File     // used in the advisory file lock (for inter-host locking)
	dbPath          string       // the file path of the db
	dbLock          sync.RWMutex // used for green thread/intra-host locking
	readLockCounter int32        // for the above mutex
}

// The singleton instance of Database, created by main when the db is loaded
var Db *Database

// Creates the singleton Database object. The DatabaseData within it is either populated from the
// database.json file or initialized.
func DatabaseFactory(dbPath string, createIfNecessary bool) {
	Db = &Database{dbPath: dbPath} // for now all of the zero values of the members are acceptable. Some will be filled in by initialize(), if necessary

	// Ensure the db dir is there, or we can create it
	dbDir := filepath.Dir(dbPath)
	_, err := os.Stat(dbDir)
	if err != nil {
		if !createIfNecessary {
			mutils.Fatal(5, "database directory %s does not exist and we were told not to create it", dbDir)
		}
		err = os.Mkdir(dbDir, 0755)
		handleError(err)
	}

	// If the db file exists, open it. Otherwise initialize() will open it
	if Db.exists(dbPath) {
		fmt.Println("Opening db file:", dbPath)
		bytes, err := ioutil.ReadFile(dbPath)
		handleError(err)
		err = json.Unmarshal(bytes, &Db.Data)
		handleError(err)

		// not sure if we need to leave the file open for the advisory file lock
		//Db.fileDesc, err = os.Open(dbPath)
		//handleError(err)
	} else {
		if !createIfNecessary {
			mutils.Fatal(5, "database file %s does not exist and we were told not to create it", dbPath)
		}
		fmt.Println("Creating/initializing db file:", dbPath)
		Db.initialize(dbPath)
	}
}

func (db *Database) exists(dbPath string) bool {
	_, err := os.Stat(dbPath)
	return err == nil
}

// If the db file doesn't exist yet, initialize our db struct and write it into the file
func (db *Database) initialize(dbPath string) {
	if db.exists(dbPath) {
		return
	}

	// Initialize some of the zero values in the structs
	var err error
	db.Data.Version = 1

	db.Data.CookieHashKey = make([]byte, 64)
	_, err = rand.Read(db.Data.CookieHashKey)
	handleError(err)

	db.Data.CookieBlockKey = make([]byte, 32)
	_, err = rand.Read(db.Data.CookieBlockKey)
	handleError(err)

	dbUserId, err := mutils.GenerateUuid()
	handleError(err)
	//dbUserPassword, err := mutils.GenerateUuid()
	//someday: force them to change this
	dbUserPassword := INITIAL_ADMIN_PW
	handleError(err)
	dbUserPasswordHash, err := bcrypt.GenerateFromPassword([]byte(dbUserPassword), bcrypt.DefaultCost)
	handleError(err)

	db.Data.Jobs = make(map[string]DatabaseJob)

	dbUser := DatabaseUser{
		Id:       dbUserId,
		Username: "admin",
		Password: dbUserPasswordHash,
		IsAdmin:  true,
	}

	db.Data.Users = make(map[string]DatabaseUser)
	db.Data.Users[dbUser.Id] = dbUser

	// Write the data to the database file
	//db.fileDesc, err = os.OpenFile(dbPath, os.O_RDWR|os.O_CREATE, 0644)
	//handleError(err)

	err = db.Persist()
	handleError(err)

	fmt.Println("Initialized database")
	//fmt.Println("Username:", dbUser.Username)
	//fmt.Println("Password:", dbUserPassword)
}

// Write the db to the file. (The caller must call Lock/Unlock appropriately)
func (db *Database) Persist() error {
	dbJson, err := json.Marshal(db.Data)
	if err != nil {
		return err
	}

	//_, err = db.fileDesc.Write(dbJson)
	err = ioutil.WriteFile(db.dbPath, dbJson, 0644) // this will create it if it doesn't exist
	return err
}

/* For the db locking methods, we are managing 2 locks:
1. A local mutex that prevents 2 of our local go routines from writing the db file at the same time. This works because the web server runs as multiple go routines in a singe process.
2. An advisory lock on the shared nfsv4 file to prevent 2 mendel-web-ui servers (on different machines) from writing the db file at the same time
*/

// Lock the db for reading (multiple read locks are allowed)
func (db *Database) RLock() {
	// Get the local read lock 1st, so we don't get the nfsv4 read lock until we know it's allowed locally
	db.dbLock.RLock()

	//db.readLockCounter++  // need to protect against multiple go routines changing the counter
	counter := atomic.AddInt32(&db.readLockCounter, 1)
	//todo: if counter == 1, do advisory read lock on the db file
	mutils.Verbose("Added a db read lock, counter: %d", counter)
}

// Unlock the db for reading
func (db *Database) RUnlock() {
	// Release the nfsv4 lock before releasing our local read lock
	//db.readLockCounter--  // need to protect against multiple go routines changing the counter
	counter := atomic.AddInt32(&db.readLockCounter, -1)
	//todo: if counter == 0, remove advisory read lock on the db file
	mutils.Verbose("Removed a db read lock, counter: %d", counter)

	db.dbLock.RUnlock()
}

// Lock the db for writing (not completed until there are no other read or write locks)
func (db *Database) Lock() {
	mutils.Verbose("Requesting write lock...")
	db.dbLock.Lock()
	// will not get here until no other local go routines have any local locks
	//todo: get advisory write lock on the db file
	mutils.Verbose("Got write lock")
}

// Unlock the db for writing
func (db *Database) Unlock() {
	// 1st remove the advisory write lock on the db file
	//todo: release advisory write lock on the db file
	db.dbLock.Unlock()
	mutils.Verbose("Released write lock")
}

// Internal utility functions

func handleError(err error) {
	if err == nil {
		return
	}
	panic(err) //todo: handle this better
}
