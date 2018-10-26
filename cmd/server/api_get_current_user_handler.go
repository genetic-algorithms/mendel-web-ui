package main

import (
	"net/http"
)

func apiGetCurrentUserHandler(w http.ResponseWriter, r *http.Request) {
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	writeJsonResponse(w, map[string]interface{}{
		"username": user.Username,
		"is_admin": user.IsAdmin,
	})
}
