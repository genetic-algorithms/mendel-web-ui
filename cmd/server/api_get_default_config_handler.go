package main

import (
	"io/ioutil"
	"net/http"
)

// Called for /api/default-config/ route
func apiGetDefaultConfigHandler(w http.ResponseWriter, r *http.Request) {
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	bytes, err := ioutil.ReadFile(globalDefaultConfigPath)
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not read config)", http.StatusInternalServerError)
		return
	}

	writeJsonResponse(w, map[string]string{
		"config": string(bytes),
	})
}
