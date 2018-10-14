package main

import (
	"net/http"
	"sort"
)

func apiJobListHandler(w http.ResponseWriter, r *http.Request) {
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	all := r.URL.Query().Get("filter") == "all"

	jobs := []DatabaseJob{}
	globalDbLock.RLock()
	for _, job := range globalDb.Jobs {
		if all || user.Id == job.OwnerId {
			jobs = append(jobs, job)
		}
	}
	globalDbLock.RUnlock()

	sort.Slice(jobs, func(i, j int) bool {
		return jobs[i].Time.After(jobs[j].Time)
	})

	writeJsonResponse(w, map[string][]DatabaseJob{
		"jobs": jobs,
	})
}
