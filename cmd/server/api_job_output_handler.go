package main

// Called for /api/job-output/ route to get the stdout of the job

import (
	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/db"
	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/mutils"
	"io/ioutil"
	"net/http"
	"path/filepath"
	"strconv"
)

func apiJobOutputHandler(w http.ResponseWriter, r *http.Request) {
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	jobId := r.URL.Query().Get("jobId")
	offset, err := strconv.Atoi(r.URL.Query().Get("offset"))
	if err != nil {
		http.Error(w, "400 Bad Request (cannot convert offset to int)", http.StatusBadRequest)
		return
	}
	mutils.Verbose("/api/job-output/ jobId=%s, offset=%d", jobId, offset)

	jobDir := filepath.Join(globalJobsDir, jobId)

	globalRunningJobsLock.RLock()
	job := db.Db.Data.Jobs[jobId]
	output, inProgress := globalRunningJobsOutput[jobId]
	offsetOutput := ""

	if inProgress {
		offsetOutput = output.String()[offset:]
	} else {
		bytes, err := ioutil.ReadFile(filepath.Join(jobDir, "mendel_go.out"))
		if err != nil {
			globalRunningJobsLock.RUnlock()
			http.Error(w, "500 Internal Server Error (could not read mendel_go.out)", http.StatusInternalServerError)
			return
		}
		offsetOutput = string(bytes)[offset:]
	}
	globalRunningJobsLock.RUnlock()

	mutils.WriteJsonResponse(w, map[string]interface{}{
		"output": offsetOutput,
		"done":   !inProgress,
		"description": job.Description,
		"time": job.Time,
	})
}
