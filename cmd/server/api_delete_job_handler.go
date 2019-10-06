package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

// Called for /api/delete-job/ route
func apiDeleteJobHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("In /api/delete-job/ ...")
	type PostJob struct {
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
	var postJob PostJob
	err := decoder.Decode(&postJob)
	if err != nil {
		http.Error(w, "400 Bad Request (parsing body)", http.StatusBadRequest)
		return
	}

	globalDbLock.Lock()
	// Remove the job data files first
	jobDir := filepath.Join(globalJobsDir, postJob.Id)
	//log.Printf("In /api/delete-job/: deleting %s ...", jobDir)
	err = os.RemoveAll(jobDir)

	if err == nil {
		// Now remove the job from the db
		//log.Printf("In /api/delete-job/: now deleting %s from db ...", postJob.Id)
		delete(globalDb.Jobs, postJob.Id)
		err = persistDatabase()
	}
	globalDbLock.Unlock()
	if err != nil {
		log.Printf("Error in /api/delete-job/: %v", err)
		http.Error(w, "500 Internal Server Error (could not persist database)", http.StatusInternalServerError)
		return
	}

	writeJsonResponse(w, map[string]string{})
}