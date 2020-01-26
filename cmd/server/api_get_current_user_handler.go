package main

import (
	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/mutils"
	"net/http"
)

// Called for /api/get-current-user/ route
func apiGetCurrentUserHandler(w http.ResponseWriter, r *http.Request) {
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}
	mutils.Verbose("/api/get-current-user/ user.Id=%s", user.Id)

	mutils.WriteJsonResponse(w, map[string]interface{}{
		"id":       user.Id,
		"username": user.Username,
		"is_admin": user.IsAdmin,
	})
}
