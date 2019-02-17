package main

import (
	"io/ioutil"
	"net/http"
	"path/filepath"
)

// Called for /api/job-config/ route
func apiGetJobConfigHandler(w http.ResponseWriter, r *http.Request) {
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	jobId := r.URL.Query().Get("jobId")

	configFilePath := filepath.Join(globalJobsDir, jobId, "mendel_go.toml")
	bytes, err := ioutil.ReadFile(configFilePath)
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not read config)", http.StatusInternalServerError)
		return
	}

	// Also get description from db and fill in below
	globalDbLock.RLock()
	jobDescription := globalDb.Jobs[jobId].Description
	globalDbLock.RUnlock()

	writeJsonResponse(w, map[string]string{
		"description": jobDescription,
		"config":      string(bytes),
	})
}
