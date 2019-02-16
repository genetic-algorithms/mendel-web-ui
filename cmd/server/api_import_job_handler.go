package main

import (
	"time"
	"encoding/json"
	"net/http"
	"archive/zip"
	"bytes"
	"encoding/base64"
	"path/filepath"
	"os"
	"io"
)

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

	jobId, err := generateJobId()
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not generate jobId)", http.StatusInternalServerError)
		return
	}

	jobDir := filepath.Join(globalJobsDir, jobId)

	for _, srcFileInfo := range zipReader.File {
		srcFile, err := srcFileInfo.Open()
		if err != nil {
			http.Error(w, "500 Internal Server Error (could not open source file)", http.StatusInternalServerError)
			return
		}

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
		Id: jobId,
		Time: time.Now().UTC(),
		OwnerId: user.Id,
		Status: "succeeded",
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
