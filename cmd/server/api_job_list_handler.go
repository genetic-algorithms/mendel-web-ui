package main

import (
	"net/http"
	"sort"
	"time"
)

// Called for /api/job-list/ route
type ApiJobListHandlerJob struct {
	Id          string    `json:"id"`
	Description string    `json:"description"`
	Time        time.Time `json:"time"`
	Status      string    `json:"status"`
	Username    string    `json:"username"`
}

func apiJobListHandler(w http.ResponseWriter, r *http.Request) {
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	all := r.URL.Query().Get("filter") == "all"

	jobs := []ApiJobListHandlerJob{}
	globalDbLock.RLock()
	for _, job := range globalDb.Jobs {
		if all || user.Id == job.OwnerId {
			jobs = append(jobs, ApiJobListHandlerJob{
				Id:          job.Id,
				Description: job.Description,
				Time:        job.Time,
				Status:      job.Status,
				Username:    globalDb.Users[job.OwnerId].Username,
			})
		}
	}
	globalDbLock.RUnlock()

	sort.Slice(jobs, func(i, j int) bool {
		return jobs[i].Time.After(jobs[j].Time)
	})

	writeJsonResponse(w, map[string][]ApiJobListHandlerJob{
		"jobs": jobs,
	})
}
