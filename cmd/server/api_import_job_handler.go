package main

import (
	"archive/zip"
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/BurntSushi/toml"
)

// Called for /api/import-job/ route
func apiImportJobHandler(w http.ResponseWriter, r *http.Request) {
	type PostContents struct {
		Contents string `json:"contents"`
	}

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
	var postContents PostContents
	err := decoder.Decode(&postContents)
	if err != nil {
		http.Error(w, "400 Bad Request (parsing body)", http.StatusBadRequest)
		return
	}

	contentsBytes, err := base64.StdEncoding.DecodeString(postContents.Contents)
	bytesReader := bytes.NewReader(contentsBytes)
	zipReader, err := zip.NewReader(bytesReader, int64(len(contentsBytes)))

	/* jobId, err := generateJobId()
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not generate jobId)", http.StatusInternalServerError)
		return
	} */

	// First go thru the zip files to find mendel_go.toml to get the case_id and description
	jobId := ""
	description := ""
	for _, srcFileInfo := range zipReader.File {
		fmt.Printf("found %s in zip file\n", srcFileInfo.Name)
		if srcFileInfo.Name != "mendel_go.toml" {
			continue
		}
		srcFile, err := srcFileInfo.Open()
		if err != nil {
			http.Error(w, "500 Internal Server Error (could not open source file)", http.StatusInternalServerError)
			return
		}

		// Parse the toml and get the case_id and description
		fmt.Printf("reading %s during job import to get case_id and description\n", srcFileInfo.Name)
		var config map[string]map[string]interface{}
		_, err = toml.DecodeReader(srcFile, &config)
		if err != nil {
			http.Error(w, "400 Bad Request (parsing toml)", http.StatusBadRequest)
			return
		}
		srcFile.Close()
		if basic, ok := config["basic"]; ok {
			if case_id, ok := basic["case_id"]; ok {
				jobId = case_id.(string)
			} else {
				log.Printf("Error: did not find case_id in %s during job import\n", srcFileInfo.Name)
				http.Error(w, "400 Bad Request (case_id not in toml)", http.StatusBadRequest)
				return
			}
			if desc, ok := basic["description"]; ok {
				description = desc.(string)
			} // not find description is not fatal
		} else {
			log.Printf("Error: did not find case_id and description in %s during job import\n", srcFileInfo.Name)
			http.Error(w, "400 Bad Request (case_id and description not in toml)", http.StatusBadRequest)
			return
		}
		break // dont need to keep searching
	}
	if jobId == "" {
		log.Printf("Error: did not find case_id and description in %s during job import\n", "mendel_go.toml")
		http.Error(w, "400 Bad Request (toml file not in zip file)", http.StatusBadRequest)
		return
	}

	jobDir := filepath.Join(globalJobsDir, jobId)

	// Now go thru all of the zip files to copy them to the jobs dir
	for _, srcFileInfo := range zipReader.File {
		srcFile, err := srcFileInfo.Open()
		if err != nil {
			http.Error(w, "500 Internal Server Error (could not open source file)", http.StatusInternalServerError)
			return
		}
		defer srcFile.Close()

		err = os.MkdirAll(filepath.Join(jobDir, filepath.Dir(srcFileInfo.Name)), 0755)
		if err != nil {
			http.Error(w, "500 Internal Server Error (could not create destination directories)", http.StatusInternalServerError)
			return
		}

		destFile, err := os.Create(filepath.Join(jobDir, srcFileInfo.Name))
		if err != nil {
			http.Error(w, "500 Internal Server Error (could not create destination file)", http.StatusInternalServerError)
			return
		}

		_, err = io.Copy(destFile, srcFile)
		if err != nil {
			http.Error(w, "500 Internal Server Error (could not copy source to destination)", http.StatusInternalServerError)
			return
		}
	}

	job := DatabaseJob{
		Id:          jobId,
		Description: description,
		Time:        time.Now().UTC(),
		OwnerId:     user.Id,
		Status:      "succeeded",
	}

	globalDbLock.Lock()
	globalDb.Jobs[jobId] = job
	err = persistDatabase()
	globalDbLock.Unlock()
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not persist database)", http.StatusInternalServerError)
		return
	}

	writeJsonResponse(w, map[string]string{
		"job_id": jobId,
	})
}
