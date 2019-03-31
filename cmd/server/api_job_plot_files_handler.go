package main

// Called for /api/job-plot-files/ route

import (
	"io/ioutil"
	"log"
	"net/http"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
)

type ApiJobPlotFilesResp struct {
	Files  []string `json:"files"`
	Tribes []int    `json:"tribes"`
}

func apiJobPlotFilesHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("In /api/job-plot-files/%s ...", r.URL.Query())
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	jobId := r.URL.Query().Get("jobId")
	if jobId == "" {
		http.Error(w, "jobId parameter not specified", http.StatusBadRequest)
		return
	}
	resp := ApiJobPlotFilesResp{}

	globalRunningJobsLock.RLock()
	jobDir := filepath.Join(globalJobsDir, jobId)
	var err error
	resp.Files, resp.Tribes, err = readJobDir(jobDir)
	if err != nil {
		http.Error(w, "Internal error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	globalRunningJobsLock.RUnlock()

	sort.Slice(resp.Tribes, func(i, j int) bool {
		return resp.Tribes[i] < resp.Tribes[j]
	})

	writeJsonResponse(w, resp)
}

// Read the given dir and return the non-fully-qualified files and the tribe numbers
func readJobDir(dir string) (files []string, tribes []int, err error) {
	dirEntries, err := ioutil.ReadDir(dir)
	if err != nil {
		return nil, nil, err
	}
	for _, f := range dirEntries {
		if f.IsDir() && strings.HasPrefix(f.Name(), "tribe-") {
			// This is a tribe dir, get the num and convert to int
			i, err := strconv.Atoi(strings.TrimPrefix(f.Name(), "tribe-"))
			if err != nil {
				return nil, nil, err
			}
			tribes = append(tribes, i)
		} else {
			// This is a plot file or dir
			if f.IsDir() {
				// Dir, see if it is has content
				subDirFiles, err := ioutil.ReadDir(dir + "/" + f.Name())
				if err != nil {
					return nil, nil, err
				}
				if len(subDirFiles) > 0 {
					files = append(files, f.Name())
				}
			} else {
				// Regular file
				files = append(files, f.Name())
			}
		}
	}
	return
}
