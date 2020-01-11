package main

import (
	"bufio"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/BurntSushi/toml"
	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/db"
	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/mutils"
)

// Called for /api/create-job/ route
func apiCreateJobHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("In /api/create-job/ ...")
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	if !mutils.IsValidPostJson(r) {
		http.Error(w, "400 Bad Request (method or content-type)", http.StatusBadRequest)
		return
	}

	// From the request body get the mendel-go job input params
	decoder := json.NewDecoder(r.Body)
	var data struct {
		Config string `json:"config"`
	}
	err := decoder.Decode(&data)
	if err != nil {
		http.Error(w, "400 Bad Request (parsing body)", http.StatusBadRequest)
		return
	}

	var config map[string]map[string]interface{}
	_, err = toml.Decode(data.Config, &config)
	if err != nil {
		http.Error(w, "400 Bad Request (parsing toml)", http.StatusBadRequest)
		return
	}

	jobId, err := mutils.GenerateJobId()
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not generate jobId)", http.StatusInternalServerError)
		return
	}

	jobDir := filepath.Join(globalJobsDir, jobId)
	err = os.MkdirAll(jobDir, 0755)
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not create job directory)", http.StatusInternalServerError)
		return
	}

	config["basic"]["case_id"] = jobId
	config["computation"]["data_file_path"] = jobDir

	configFilePath := filepath.Join(jobDir, "mendel_go.toml")
	configFile, err := os.Create(configFilePath)
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not create job mendel_go.toml file)", http.StatusInternalServerError)
		return
	}

	err = toml.NewEncoder(configFile).Encode(config)
	// close the file before handling the potential encode err, because we want to close it regardless
	if errClose := configFile.Close(); errClose != nil {
		http.Error(w, "500 Internal Server Error (could not close job config)", http.StatusInternalServerError)
		return
	}
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not encode job config)", http.StatusInternalServerError)
		return
	}

	outputBuilder := &strings.Builder{}

	globalRunningJobsLock.Lock()
	globalRunningJobsOutput[jobId] = outputBuilder
	globalRunningJobsLock.Unlock()

	job := db.DatabaseJob{
		Id:          jobId,
		Description: config["basic"]["description"].(string),
		Time:        time.Now().UTC(),
		OwnerId:     user.Id,
		Status:      "running",
	}

	db.Db.Lock()
	db.Db.Data.Jobs[jobId] = job
	db.Db.Unlock()

	go func() {
		cmd := exec.Command(globalMendelGoBinaryPath, "-f", configFilePath)
		stdout, err := cmd.StdoutPipe()
		if err != nil {
			log.Println(err)
		}

		err = cmd.Start()
		if err != nil {
			log.Println(err)
		}

		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			globalRunningJobsLock.Lock()
			outputBuilder.WriteString(scanner.Text())
			outputBuilder.WriteString("\n")
			globalRunningJobsLock.Unlock()
		}

		err = cmd.Wait()
		if err != nil {
			log.Println(err)
			job.Status = "failed"
			db.Db.Lock()
			db.Db.Data.Jobs[jobId] = job
			err = db.Db.Persist()
			db.Db.Unlock()
			if err != nil {
				http.Error(w, "500 Internal Server Error (could not persist database)", http.StatusInternalServerError)
				return
			}
		}

		job.Status = "succeeded"
		db.Db.Lock()
		db.Db.Data.Jobs[jobId] = job
		err = db.Db.Persist()
		db.Db.Unlock()
		if err != nil {
			http.Error(w, "500 Internal Server Error (could not persist database)", http.StatusInternalServerError)
			return
		}

		globalRunningJobsLock.Lock()
		defer globalRunningJobsLock.Unlock()
		delete(globalRunningJobsOutput, jobId)

		err = ioutil.WriteFile(filepath.Join(jobDir, "mendel_go.out"), []byte(outputBuilder.String()), 0644)
		if err != nil {
			http.Error(w, "500 Internal Server Error (could not write to mendel_go.out file)", http.StatusInternalServerError)
			return
		}
	}()

	mutils.WriteJsonResponse(w, map[string]string{
		"job_id": jobId,
	})
}
