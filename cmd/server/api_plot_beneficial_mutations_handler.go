package main

import (
	"encoding/json"
	"net/http"
	"io/ioutil"
	"path/filepath"
	"strings"
)

func apiPlotBeneficialMutationsHandler(w http.ResponseWriter, r *http.Request) {
	type GenerationData struct {
		Generation int `json:"generation"`
		BinMidpointFitness []float64 `json:"binmidpointfitness"`
		Dominant []float64 `json:"dominant"`
		Recessive []float64 `json:"recessive"`
	}

	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	jobId := r.URL.Query().Get("jobId")

	globalRunningJobsLock.RLock()
	fileInfos, err := ioutil.ReadDir(filepath.Join(globalJobsDir, jobId, "allele-distribution-fav"))

	if err != nil {
		globalRunningJobsLock.RUnlock()
		http.Error(w, "500 Internal Server Error (could not list allele-distribution-fav directory)", http.StatusInternalServerError)
		return
	}

	result := []GenerationData{}
	for _, fileInfo := range fileInfos {
		fileName := fileInfo.Name()

		if strings.HasSuffix(fileName, ".json") {
			bytes, err := ioutil.ReadFile(filepath.Join(globalJobsDir, jobId, "allele-distribution-fav", fileName))
			if err != nil {
				globalRunningJobsLock.RUnlock()
				http.Error(w, "500 Internal Server Error (could not read file: " + fileName + ")", http.StatusInternalServerError)
				return
			}

			var generationData GenerationData
			err = json.Unmarshal(bytes, &generationData)
			if err != nil {
				globalRunningJobsLock.RUnlock()
				http.Error(w, "500 Internal Server Error (could not parse json file: " + fileName + ")", http.StatusInternalServerError)
				return
			}

			result = append(result, generationData)
		}
	}
	globalRunningJobsLock.RUnlock()

	writeJsonResponse(w, result)
}
