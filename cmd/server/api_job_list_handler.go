package main

// Called for /api/job-list/ route

import (
	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/db"
	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/mutils"
	"log"
	"net/http"
	"sort"
	"time"
)

type ApiJobListHandlerJob struct {
	Id          string    `json:"id"`
	Description string    `json:"description"`
	Time        time.Time `json:"time"`
	Status      string    `json:"status"`
	Username    string    `json:"username"`
}

func apiJobListHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("In /api/job-list/ %s ...", r.URL.Query())
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	all := r.URL.Query().Get("filter") == "all"
	mutils.Verbose("/api/job-list/ all=%t", all)

	jobs := []ApiJobListHandlerJob{}
	db.Db.RLock()
	for _, job := range db.Db.Data.Jobs {
		if all || user.Id == job.OwnerId {
			jobs = append(jobs, ApiJobListHandlerJob{
				Id:          job.Id,
				Description: job.Description,
				Time:        job.Time,
				Status:      job.Status,
				Username:    db.Db.Data.Users[job.OwnerId].Username,
			})
		}
	}
	db.Db.RUnlock()

	sort.Slice(jobs, func(i, j int) bool {
		return jobs[i].Time.After(jobs[j].Time)
	})

	mutils.WriteJsonResponse(w, map[string][]ApiJobListHandlerJob{
		"jobs": jobs,
	})
}
