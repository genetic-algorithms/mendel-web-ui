package main

// Called for /api/plot-snp-frequencies/ route
// To test, browse: http://0.0.0.0:8581/api/plot-snp-frequencies/?jobId=1281c1aa&tribe=1

import (
	"encoding/json"
	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/mutils"
	"io/ioutil"
	"log"
	"net/http"
	"path/filepath"
	"strings"
)

func apiPlotSnpFrequenciesHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("In /api/plot-snp-frequencies/ %s ...", r.URL.Query())
	type GenerationData struct {
		Generation        int   `json:"generation"`
		Bins              []int `json:"bins"`
		Deleterious       []int `json:"deleterious"`
		Neutral           []int `json:"neutral"`
		Favorable         []int `json:"favorable"`
		DelInitialAlleles []int `json:"delInitialAlleles"`
		FavInitialAlleles []int `json:"favInitialAlleles"`
	}

	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	jobId := r.URL.Query().Get("jobId")
	tribeNum := r.URL.Query().Get("tribe") // do not convert to int, because we need it as a string anyway
	mutils.Verbose("/api/plot-snp-frequencies/ jobId=%s, tribeNum=%s", jobId, tribeNum)

	var dir string
	if tribeNum == "" || tribeNum == "0" {
		dir = jobId // we get the plot files from the main dir
	} else {
		dir = jobId + "/tribe-" + tribeNum
	}
	dirPath := filepath.Join(globalJobsDir, dir, "allele-bins")

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
