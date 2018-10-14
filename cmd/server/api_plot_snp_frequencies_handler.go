package main

import (
	"encoding/json"
	"net/http"
	"io/ioutil"
	"path/filepath"
	"strings"
)

func apiPlotSnpFrequenciesHandler(w http.ResponseWriter, r *http.Request) {
	type GenerationData struct {
		Generation int `json:"generation"`
		Bins []int `json:"bins"`
		Deleterious []int `json:"deleterious"`
		Neutral []int `json:"neutral"`
		Favorable []int `json:"favorable"`
		DelInitialAlleles []int `json:"delInitialAlleles"`
		FavInitialAlleles []int `json:"favInitialAlleles"`
	}

	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	jobId := r.URL.Query().Get("jobId")

	globalRunningJobsLock.RLock()
	fileInfos, err := ioutil.ReadDir(filepath.Join(globalJobsDir, jobId, "allele-bins"))

    if err != nil {
		globalRunningJobsLock.RUnlock()
		http.Error(w, "500 Internal Server Error (could not list allele-bins directory)", http.StatusInternalServerError)
		return
    }

	result := []GenerationData{}
	for _, fileInfo := range fileInfos {
		fileName := fileInfo.Name()

		if strings.HasSuffix(fileName, ".json") {
			bytes, err := ioutil.ReadFile(filepath.Join(globalJobsDir, jobId, "allele-bins", fileName))
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
