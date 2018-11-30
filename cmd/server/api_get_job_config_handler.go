package main

import (
	"io/ioutil"
	"path/filepath"
	"net/http"
)

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

	writeJsonResponse(w, map[string]string{
		"config": string(bytes),
	})
}
