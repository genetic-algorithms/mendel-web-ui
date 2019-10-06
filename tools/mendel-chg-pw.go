package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"golang.org/x/crypto/bcrypt"
)

/*
A tool to change 1 of the user's passwords in the database. Use this, for example, when you've lost the admin pw.
Must be run as root, and when the web svr is stopped.
*/

type Database struct {
	Version        int                     `json:"version"`
	CookieHashKey  []byte                  `json:"cookie_hash_key"`
	CookieBlockKey []byte                  `json:"cookie_block_key"`
	Jobs           map[string]interface{}  `json:"jobs"`
	Users          map[string]DatabaseUser `json:"users"`
}

type DatabaseUser struct {
	Id       string `json:"id"`
	Username string `json:"username"`
	Password []byte `json:"password"`
	IsAdmin  bool   `json:"is_admin"`
}

var globalDb Database
var globalDbLock sync.RWMutex

// Print error msg to stderr and exit with the specified code
func Fatal(exitCode int, msg string, args ...interface{}) {
	if !strings.HasSuffix(msg, "\n") {
		msg += "\n"
	}
	l := log.New(os.Stderr, "", 0)
	l.Printf("Error: "+msg, args...)
	os.Exit(exitCode)
}

func GetEnvVarWithDefault(envVarName, defaultValue string) string {
	envVarValue := os.Getenv(envVarName)
	if envVarValue == "" {
		return defaultValue
	}
	return envVarValue
}

// Read in a parse the db
func loadDatabase(dbFile string) Database {
	bytes, err := ioutil.ReadFile(dbFile)
	if err != nil {
		Fatal(1, "%v", err)
	}

	var db Database
	err = json.Unmarshal(bytes, &db)
	if err != nil {
		Fatal(2, "%v", err)
	}

	return db
}

// Write out the db
func persistDatabase(dbFile string) error {
	dbJson, err := json.Marshal(globalDb)
	if err != nil {
		Fatal(2, "%v", err)
	}

	return ioutil.WriteFile(dbFile, dbJson, 0644)
}

func main() {
	if len(os.Args) <= 2 {
		fmt.Printf("Usage: %s <username> <pw>\n", filepath.Base(os.Args[0]))
		os.Exit(0)
	}

	username := os.Args[1]
	pw := os.Args[2]
	if pw == "" {
		Fatal(1, "password can not be empty")
	}

	dbFile := GetEnvVarWithDefault("MENDEL_DB_FILE", "/usr/local/var/run/mendel-web-ui/database/database.json")

	globalDb = loadDatabase(dbFile) // read in the db

	// Find this user in the db
	dbUser := DatabaseUser{}
	globalDbLock.RLock()
	for _, u := range globalDb.Users {
		if u.Username == username {
			dbUser = u
			break
		}
	}
	globalDbLock.RUnlock()

	if dbUser.Id == "" {
		Fatal(1, "%s does not exist in the database", username)
	}

	// Bcrypt the pw they gave us
	hashedPw, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	if err != nil {
		Fatal(3, "could not bcrypt password: %v", err)
	}
	dbUser.Password = hashedPw

	// Write out the db with the new user pw
	globalDbLock.Lock()
	globalDb.Users[dbUser.Id] = dbUser
	err = persistDatabase(dbFile)
	globalDbLock.Unlock()
	if err != nil {
		Fatal(3, "could not persist database: %v", err)
	}

	fmt.Printf("password for %s updated successfully\n", username)
}
