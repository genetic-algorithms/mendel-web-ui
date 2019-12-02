package main

// Called for /api/plot-beneficial-mutations/ route
// To test, browse: http://0.0.0.0:8581/api/plot-beneficial-mutations/?jobId=1281c1aa&tribe=1

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"path/filepath"
	"strings"
)

func apiPlotBeneficialMutationsHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("In /api/plot-beneficial-mutations/ %s ...", r.URL.Query())
	type GenerationData struct {
		Generation         int       `json:"generation"`
		BinMidpointFitness []float64 `json:"binmidpointfitness"`
		Dominant           []float64 `json:"dominant"`
		Recessive          []float64 `json:"recessive"`
	}

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
	dirPath := filepath.Join(globalJobsDir, dir, "allele-distribution-fav")

	globalRunningJobsLock.RLock()
	fileInfos, err := ioutil.ReadDir(dirPath)

	if err != nil {
		globalRunningJobsLock.RUnlock()
		http.Error(w, "500 Internal Server Error: could not list "+dirPath, http.StatusInternalServerError)
		return
	}

	result := []GenerationData{}
	for _, fileInfo := range fileInfos {
		fileName := fileInfo.Name()

		if strings.HasSuffix(fileName, ".json") {
			bytes, err := ioutil.ReadFile(filepath.Join(dirPath, fileName))
			if err != nil {
				globalRunningJobsLock.RUnlock()
				http.Error(w, "500 Internal Server Error: could not read file: "+filepath.Join(dirPath, fileName), http.StatusInternalServerError)
				return
			}

			var generationData GenerationData
			err = json.Unmarshal(bytes, &generationData)
			if err != nil {
				globalRunningJobsLock.RUnlock()
				http.Error(w, "500 Internal Server Error: could not parse json file: "+filepath.Join(dirPath, fileName), http.StatusInternalServerError)
				return
			}

			result = append(result, generationData)
		}
	}
	globalRunningJobsLock.RUnlock()

	mutils.WriteJsonResponse(w, result)
}
