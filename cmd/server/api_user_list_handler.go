package main

import (
	"net/http"
	"sort"
	"strings"
)

// Called for /api/user-list/ route
func apiUserListHandler(w http.ResponseWriter, r *http.Request) {
	user := getAuthenticatedUser(r)
	if user.Id == "" || !user.IsAdmin {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	users := []DatabaseUser{}
	globalDbLock.RLock()
	for _, user := range globalDb.Users {
		users = append(users, user)
	}
	globalDbLock.RUnlock()

	sort.Slice(users, func(i, j int) bool {
		return strings.Compare(users[i].Username, users[j].Username) < 0
	})

	writeJsonResponse(w, map[string][]DatabaseUser{
		"users": users,
	})
}
