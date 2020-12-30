package main

import (
	"bufio"
	"encoding/json"
	"io"
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
	//mutils.Verbose("/api/create-job/ job config:%s", data.Config)

	var config map[string]map[string]interface{}
	_, err = toml.Decode(data.Config, &config)
	if err != nil {
		http.Error(w, "400 Bad Request (parsing toml)", http.StatusBadRequest)
		return
	}

	// Start building the job directory content
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

	// Write out the config file to the job dir
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

	// This will collect the output of the job we are able to run
	outputBuilder := &strings.Builder{}
	globalRunningJobsLock.Lock()
	globalRunningJobsOutput[jobId] = outputBuilder
	globalRunningJobsLock.Unlock()

	// Put info about the job in the db
	job := db.DatabaseJob{
		Id:          jobId,
		Description: config["basic"]["description"].(string),
		Time:        time.Now().UTC(),
		OwnerId:     user.Id,
		Status:      "running",
	}
	db.Db.Lock()
	db.Db.Data.Jobs[jobId] = job // we will persist this to the db file when the job completes
	db.Db.Unlock()

	// Run the job in its own thread
	go func() {
		cmd := exec.Command(globalMendelGoBinaryPath, "-f", configFilePath)
		stdout, err := cmd.StdoutPipe()
		if err != nil {
			log.Printf("Error getting stdout pipe for job %s: %v", jobId, err)
		}
		stderr, err := cmd.StderrPipe()
		if err != nil {
			log.Printf("Error getting stderr pipe for job %s: %v", jobId, err)
		}

		err = cmd.Start()
		if err != nil {
			log.Printf("Error starting job %s: %v", jobId, err)
		}

		// Repeatedly get the latest bytes of output from the running job and add them to our in-memory copy so /api/job-output/ can get them and return them to the frontend
		// Following this example to combine stdout and stderr: https://gist.github.com/mxschmitt/6c07b5b97853f05455c3fdaf48b1a8b6
		// The MultiReader documentation says the list of readers are read sequentially, so put stdout before stderr
		scanner := bufio.NewScanner(io.MultiReader(stdout, stderr))
		for scanner.Scan() {
			globalRunningJobsLock.Lock()
			outputBuilder.WriteString(scanner.Text())
			outputBuilder.WriteString("\n")
			globalRunningJobsLock.Unlock()
		}

		// Wait for the job to complete and update the completion status of the job entry in the db
		err = cmd.Wait()
		if err != nil {
			log.Printf("Job %s failed: %v", jobId, err)
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

		mutils.Verbose("Job %s completed successfully. Setting job status in db, and removing the in-memory copy of job output", jobId)
		job.Status = "succeeded"
		db.Db.Lock()
		db.Db.Data.Jobs[jobId] = job
		err = db.Db.Persist()
		db.Db.Unlock()
		if err != nil {
			mutils.Verbose("Error persisting job %s in the db: %v", jobId, err)
			http.Error(w, "500 Internal Server Error (could not persist database)", http.StatusInternalServerError)
			return
		}

		globalRunningJobsLock.Lock()
		defer globalRunningJobsLock.Unlock()
		delete(globalRunningJobsOutput, jobId)

		err = ioutil.WriteFile(filepath.Join(jobDir, "mendel_go.out"), []byte(outputBuilder.String()), 0644)
		if err != nil {
			mutils.Verbose("Error writing job %s output to %s: %v", jobId, filepath.Join(jobDir, "mendel_go.out"), err)
			http.Error(w, "500 Internal Server Error (could not write to mendel_go.out file)", http.StatusInternalServerError)
			return
		}
	}()

	mutils.WriteJsonResponse(w, map[string]string{
		"job_id": jobId,
	})
}
