package main

import (
	"net/http"
)

// Called for /api/get-user/ route
func apiGetUserHandler(w http.ResponseWriter, r *http.Request) {
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	userId := r.URL.Query().Get("userId")

	globalDbLock.RLock()
	user, ok := globalDb.Users[userId]
	globalDbLock.RUnlock()

	if !ok {
		http.Error(w, "404 Not Found (user does not exist)", http.StatusNotFound)
		return
	}

	writeJsonResponse(w, map[string]interface{}{
		"id":       user.Id,
		"username": user.Username,
		"is_admin": user.IsAdmin,
	})
}
