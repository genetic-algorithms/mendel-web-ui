package main

import (
	"net/http"
	"io/ioutil"
	"path/filepath"
	"log"
	"strconv"
)

func apiPlotFitnessHistoryHandler(w http.ResponseWriter, r *http.Request) {
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	jobId := r.URL.Query().Get("jobId")

	globalRunningJobsLock.RLock()
	bytes, err := ioutil.ReadFile(filepath.Join(globalJobsDir, jobId, "mendel.fit"))
	globalRunningJobsLock.RUnlock()

    if err != nil {
		http.Error(w, "500 Internal Server Error (could not open mendel.hst)", http.StatusInternalServerError)
		return
    }

	rows := parseSpaceSeparatedPlotFile(bytes)

	generations := []int{}
	popSize := []int{}
	fitness := []float64{}

	for _, columns := range rows {
		if len(columns) < 4 {
			log.Println("not enough columns")
			continue
		}

		n, err := strconv.Atoi(columns[0])
		if err != nil {
			log.Println("cannot parse int:", columns[0])
		} else {
			generations = append(generations, n)
		}

		n, err = strconv.Atoi(columns[1])
		if err != nil {
			log.Println("cannot parse int:", columns[1])
		} else {
			popSize = append(popSize, n)
		}

		f, err := strconv.ParseFloat(columns[3], 64)
		if err != nil {
			log.Println("cannot parse float64:", columns[3])
		} else {
			fitness = append(fitness, f)
		}
	}

	writeJsonResponse(w, map[string]interface{}{
		"generations": generations,
		"pop_size": popSize,
		"fitness": fitness,
	})
}
