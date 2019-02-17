package main

import (
	"net/http"
)

// Called for /api/get-current-user/ route
func apiGetCurrentUserHandler(w http.ResponseWriter, r *http.Request) {
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	writeJsonResponse(w, map[string]interface{}{
		"id":       user.Id,
		"username": user.Username,
		"is_admin": user.IsAdmin,
	})
}
