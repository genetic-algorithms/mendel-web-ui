package main

import (
	"encoding/json"
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

	if !isValidPostJson(r) {
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

	globalDbLock.Lock()
	for _, job := range globalDb.Jobs {
		if job.OwnerId == postUser.Id {
			job.OwnerId = ""
		}
	}
	delete(globalDb.Users, postUser.Id)
	err = persistDatabase()
	globalDbLock.Unlock()
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not persist database)", http.StatusInternalServerError)
		return
	}

	writeJsonResponse(w, map[string]string{})
}
