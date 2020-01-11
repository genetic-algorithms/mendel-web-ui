package main

import (
	"encoding/json"
	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/db"
	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/mutils"
	"net/http"
)

// Called for /api/delete-user/ route
func apiDeleteUserHandler(w http.ResponseWriter, r *http.Request) {
	type PostUser struct {
		Id string `json:"id"`
	}

	user := getAuthenticatedUser(r)
	if user.Id == "" || !user.IsAdmin {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	if !mutils.IsValidPostJson(r) {
		http.Error(w, "400 Bad Request (method or content-type)", http.StatusBadRequest)
		return
	}

	decoder := json.NewDecoder(r.Body)
	var postUser PostUser
	err := decoder.Decode(&postUser)
	if err != nil {
		http.Error(w, "400 Bad Request (parsing body)", http.StatusBadRequest)
		return
	}

	db.Db.Lock()
	// Before deleting the user, find all jobs owned by them and blank out OwnerId
	for _, job := range db.Db.Data.Jobs {
		if job.OwnerId == postUser.Id {
			job.OwnerId = ""
		}
	}
	delete(db.Db.Data.Users, postUser.Id)
	err = db.Db.Persist()
	db.Db.Unlock()
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not persist database)", http.StatusInternalServerError)
		return
	}

	mutils.WriteJsonResponse(w, map[string]string{})
}
