package main

// Called for /api/plot-fitness-history/ route
// To test, browse: http://0.0.0.0:8581/api/plot-fitness-history/?jobId=1281c1aa&tribe=1

import (
	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/mutils"
	"io/ioutil"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
)

func apiPlotFitnessHistoryHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("In /api/plot-fitness-history/ %s ...", r.URL.Query())
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	jobId := r.URL.Query().Get("jobId")
	tribeNum := r.URL.Query().Get("tribe") // do not convert to int, because we need it as a string anyway
	mutils.Verbose("/api/plot-fitness-history/ jobId=%s, tribeNum=%s", jobId, tribeNum)

	var dir string
	if tribeNum == "" || tribeNum == "0" {
		dir = jobId // we get the plot files from the main dir
	} else {
		dir = jobId + "/tribe-" + tribeNum
	}
	filePath := filepath.Join(globalJobsDir, dir, "mendel.fit")

	globalRunningJobsLock.RLock()
	bytes, err := ioutil.ReadFile(filePath)
	globalRunningJobsLock.RUnlock()

	if err != nil {
		http.Error(w, "500 Internal Server Error: could not open "+filePath, http.StatusInternalServerError)
		return
	}

	rows := mutils.ParseSpaceSeparatedPlotFile(bytes)

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

	mutils.WriteJsonResponse(w, map[string]interface{}{
		"generations": generations,
		"pop_size":    popSize,
		"fitness":     fitness,
	})
}
