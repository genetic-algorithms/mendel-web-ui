package main

import (
	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/db"
	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/mutils"
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
	mutils.Verbose("/api/user-list/ user.Id=%s", user.Id)

	users := []db.DatabaseUser{}
	db.Db.RLock()
	for _, user := range db.Db.Data.Users {
		users = append(users, user)
	}
	db.Db.RUnlock()

	sort.Slice(users, func(i, j int) bool {
		return strings.Compare(users[i].Username, users[j].Username) < 0
	})

	mutils.WriteJsonResponse(w, map[string][]db.DatabaseUser{
		"users": users,
	})
}
