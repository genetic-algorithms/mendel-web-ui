package mutils

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
)

// General utilities for the backend server side of mendel-web-ui

var IsVerbose bool

// Used to generate ids to store users in the db with
func GenerateUuid() (string, error) {
	bytes := make([]byte, 16) // 32 hex chars

	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}

	return hex.EncodeToString(bytes), nil
}

// Used to generate the id for each job run
func GenerateJobId() (string, error) {
	bytes := make([]byte, 4) // 8 hex chars

	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}

	//todo: check to see if this id is already in the db, and generate another one if it is
	return hex.EncodeToString(bytes), nil
}

func WriteJsonResponse(w http.ResponseWriter, data interface{}) {
	dataJson, err := json.Marshal(data)
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not encode json response)", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_, err = w.Write(dataJson)
	if err != nil {
		Error(err.Error())
	}
}

func SetVerbose() {
	v := GetEnvVarWithDefault("VERBOSE", "false")
	if v=="1" || strings.ToLower(v)=="true" {
		IsVerbose = true
	} else {
		IsVerbose = false
	}
}

// Print error msg to stderr
func Verbose(msg string, args ...interface{}) {
	if !IsVerbose {
		return
	}
	if !strings.HasSuffix(msg, "\n") {
		msg += "\n"
	}
	fmt.Printf("Verbose: "+msg, args...)
}

// Print error msg to stderr
func Error(msg string, args ...interface{}) {
	if !strings.HasSuffix(msg, "\n") {
		msg += "\n"
	}
	l := log.New(os.Stderr, "", 0)
	l.Printf("Error: "+msg, args...)
}

// Print error msg to stderr and exit with the specified code
func Fatal(exitCode int, msg string, args ...interface{}) {
	Error(msg, args...)
	os.Exit(exitCode)
}

func GetEnvVarWithDefault(envVarName, defaultValue string) string {
	envVarValue := os.Getenv(envVarName)
	if envVarValue == "" {
		return defaultValue
	}
	return envVarValue
}

func ParseSpaceSeparatedPlotFile(bytes []byte) [][]string {
	lines := strings.Split(string(bytes), "\n")

	numberLines := [][]string{}
	for _, line := range lines {
		if line != "" && !strings.HasPrefix(line, "#") {
			numberLines = append(numberLines, strings.Fields(line))
		}
	}

	return numberLines
}

func IsValidPostJson(r *http.Request) bool {
	if r.Method != "POST" {
		return false
	}

	val, ok := r.Header["Content-Type"]

	if !ok || len(val) == 0 || val[0] != "application/json" {
		return false
	}

	return true
}
