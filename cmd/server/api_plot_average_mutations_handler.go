package main

// Called for /api/plot-average-mutations/ route
// To test, browse: http://0.0.0.0:8581/api/plot-average-mutations/?jobId=1281c1aa&tribe=1

import (
	"io/ioutil"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
)

func apiPlotAverageMutationsHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("In /api/plot-average-mutations/ %s ...", r.URL.Query())
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	jobId := r.URL.Query().Get("jobId")
	tribeNum := r.URL.Query().Get("tribe") // do not convert to int, because we need it as a string anyway
	var dir string
	if tribeNum == "" || tribeNum == "0" {
		dir = jobId // we get the plot files from the main dir
	} else {
		dir = jobId + "/tribe-" + tribeNum
	}
	filePath := filepath.Join(globalJobsDir, dir, "mendel.hst")

	globalRunningJobsLock.RLock()
	bytes, err := ioutil.ReadFile(filePath)
	globalRunningJobsLock.RUnlock()

	if err != nil {
		http.Error(w, "500 Internal Server Error: could not open "+filePath, http.StatusInternalServerError)
		return
	}

	rows := mutils.ParseSpaceSeparatedPlotFile(bytes)

	generations := []int{}
	deleterious := []float64{}
	neutral := []float64{}
	favorable := []float64{}

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

		f, err := strconv.ParseFloat(columns[1], 64)
		if err != nil {
			log.Println("cannot parse float64:", columns[1])
		} else {
			deleterious = append(deleterious, f)
		}

		f, err = strconv.ParseFloat(columns[2], 64)
		if err != nil {
			log.Println("cannot parse float64:", columns[2])
		} else {
			neutral = append(neutral, f)
		}

		f, err = strconv.ParseFloat(columns[3], 64)
		if err != nil {
			log.Println("cannot parse float64:", columns[3])
		} else {
			favorable = append(favorable, f)
		}
	}

	mutils.WriteJsonResponse(w, map[string]interface{}{
		"generations": generations,
		"deleterious": deleterious,
		"neutral":     neutral,
		"favorable":   favorable,
	})
}
