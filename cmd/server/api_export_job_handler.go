package main

import (
	"archive/zip"
	"bytes"
	"encoding/base64"
	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/mutils"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
)

// Called for /api/export-job/ route
func apiExportJobHandler(w http.ResponseWriter, r *http.Request) {
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	jobId := r.URL.Query().Get("jobId")
	mutils.Verbose("/api/export-job/ user.Id=%s, jobId=%s", user.Id,jobId)


	jobDir := filepath.Join(globalJobsDir, jobId)
	zipBuf := new(bytes.Buffer)
	zipWriter := zip.NewWriter(zipBuf)

	err := filepath.Walk(jobDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() {
			relativePath := path[len(jobDir)+1:]
			b, err := ioutil.ReadFile(path)
			if err != nil {
				return err
			}

			f, err := zipWriter.Create(relativePath)
			if err != nil {
				return err
			}

			_, err = f.Write(b)
			if err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not generate zip)", http.StatusInternalServerError)
		return
	}

	err = zipWriter.Close()
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not write zip)", http.StatusInternalServerError)
		return
	}

	mutils.WriteJsonResponse(w, map[string]string{
		"contents": base64.StdEncoding.EncodeToString(zipBuf.Bytes()),
	})
}
