package main

// Called for /api/job-plot-files/?jobId=<jobid> route.
// To test, browse: http://0.0.0.0:8581/api/job-plot-files/?jobId=1281c1aa&tribe=1

import (
	"io/ioutil"
	"log"
	"net/http"
	"os"
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
	log.Printf("In /api/job-plot-files/ %s ...", r.URL.Query())
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get url parameters
	jobId := r.URL.Query().Get("jobId")
	if jobId == "" {
		http.Error(w, "jobId parameter not specified", http.StatusBadRequest)
		return
	}
	// If tribe is empty or 0, return the files in the main dir, otherwise return the files in this tribe subdir
	tribeNum := r.URL.Query().Get("tribe") // do not convert to int, because we need it as a string anyway
	resp := ApiJobPlotFilesResp{}

	globalRunningJobsLock.RLock()
	jobDir := filepath.Join(globalJobsDir, jobId)
	var err error
	resp.Files, resp.Tribes, err = readJobDir(jobDir, tribeNum)
	if err != nil {
		http.Error(w, "Internal error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	globalRunningJobsLock.RUnlock()

	sort.Slice(resp.Tribes, func(i, j int) bool {
		return resp.Tribes[i] < resp.Tribes[j]
	})

	mutils.WriteJsonResponse(w, resp)
}

// Read the given dir and return the non-fully-qualified files and the tribe numbers
func readJobDir(dir, tribeNum string) (files []string, tribes []int, err error) {
	// If nothing found, return emtpy arrays instead of null
	files = []string{}
	tribes = []int{}

	// We potentially need to read 2 directories: the main dir to get the tribes, and the tribe subdir to get the plot files.
	// First get the list of tribe numbers
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
		}
	}

	// Now get the plot files
	var plotEntries []os.FileInfo
	if tribeNum == "" || tribeNum == "0" {
		plotEntries = dirEntries // we get the plot files from the main dir
	} else {
		dir = dir + "/tribe-" + tribeNum
		plotEntries, err = ioutil.ReadDir(dir)
		if err != nil {
			return nil, nil, err
		}
	}

	for _, f := range plotEntries {
		if f.IsDir() && strings.HasPrefix(f.Name(), "tribe-") {
			continue
		}
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
	return
}
