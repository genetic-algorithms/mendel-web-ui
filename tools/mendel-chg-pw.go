package main

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/db"
	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/mutils"
	"golang.org/x/crypto/bcrypt"
)

/*
A tool to change 1 of the user's passwords in the database. Use this, for example, when you've lost the admin pw.
Must be run as root, and when the web svr is stopped.
*/

func main() {
	if len(os.Args) <= 2 {
		fmt.Printf("Usage: %s <username> <pw>\n", filepath.Base(os.Args[0]))
		os.Exit(0)
	}

	username := os.Args[1]
	pw := os.Args[2]
	if pw == "" {
		mutils.Fatal(1, "password can not be empty")
	}

	dbFile := mutils.GetEnvVarWithDefault("MENDEL_DB_FILE", "/usr/local/var/run/mendel-web-ui/database/database.json")
	db.DatabaseFactory(dbFile, false) // populates the db.Db singleton object with the current db file content (expects the file to exist)

	// Find this user in the db
	dbUser := db.DatabaseUser{}
	db.Db.RLock()
	for _, u := range db.Db.Data.Users {
		if u.Username == username {
			dbUser = u
			break
		}
	}
	db.Db.RUnlock()

	if dbUser.Id == "" {
		mutils.Fatal(1, "%s does not exist in the database", username)
	}

	// Bcrypt the pw they gave us
	hashedPw, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	if err != nil {
		mutils.Fatal(3, "could not bcrypt password: %v", err)
	}
	dbUser.Password = hashedPw

	// Write out the db with the new user pw
	db.Db.Lock()
	db.Db.Data.Users[dbUser.Id] = dbUser
	err = db.Db.Persist()
	db.Db.Unlock()
	if err != nil {
		mutils.Fatal(3, "could not persist database: %v", err)
	}

	fmt.Printf("password for %s updated successfully\n", username)
}
