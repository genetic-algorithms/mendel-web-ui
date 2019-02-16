package main

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"os/exec"
	"bufio"
	"strings"
	"log"
	"time"
	"io/ioutil"
	"github.com/BurntSushi/toml"
)

func apiCreateJobHandler(w http.ResponseWriter, r *http.Request) {
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	if !isValidPostJson(r) {
		http.Error(w, "400 Bad Request (method or content-type)", http.StatusBadRequest)
		return
	}

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

	jobId, err := generateUuid()
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
	if err != nil {
		configFile.Close()
		http.Error(w, "500 Internal Server Error (could not encode job config)", http.StatusInternalServerError)
		return
	}
	configFile.Close()

	outputBuilder := &strings.Builder{}

	globalRunningJobsLock.Lock()
	globalRunningJobsOutput[jobId] = outputBuilder
	globalRunningJobsLock.Unlock()

	job := DatabaseJob{
		Id: jobId,
		Time: time.Now().UTC(),
		OwnerId: user.Id,
		Status: "running",
	}

	globalDbLock.Lock()
	globalDb.Jobs[jobId] = job
	globalDbLock.Unlock()

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
			globalDbLock.Lock()
			globalDb.Jobs[jobId] = job
			err = persistDatabase()
			globalDbLock.Unlock()
			if err != nil {
				http.Error(w, "500 Internal Server Error (could not persist database)", http.StatusInternalServerError)
				return
			}
		}

		job.Status = "succeeded"
		globalDbLock.Lock()
		globalDb.Jobs[jobId] = job
		err = persistDatabase()
		globalDbLock.Unlock()
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

	writeJsonResponse(w, map[string]string{
		"job_id": jobId,
	})
}
