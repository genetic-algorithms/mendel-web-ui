package main

import (
	"bufio"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"golang.org/x/crypto/bcrypt"
	"github.com/gorilla/securecookie"
	"github.com/BurntSushi/toml"
	"github.com/genetic-algorithms/mendel-web-example/templates"
)

type settings struct {
	CookieHashKey []byte `json:"cookie_hash_key"`
	CookieBlockKey []byte `json:"cookie_block_key"`
	CsrfKey []byte `json:"csrf_key"`
	Password string `json:"password"`
}

type templateStore struct {
	base *template.Template
}

var globalTemplateStore templateStore
var globalSettings settings
var globalSecureCookie *securecookie.SecureCookie
var globalRunningJobsOutput map[string]*strings.Builder
var globalRunningJobsLock sync.RWMutex
var globalJobsDir string = "./output/jobs"


func main() {
	var err error

	globalRunningJobsOutput = make(map[string]*strings.Builder)

	globalTemplateStore = loadTemplates()
	globalSettings, err = loadSettings()
	check(err)

	globalSecureCookie = securecookie.New(globalSettings.CookieHashKey, globalSettings.CookieBlockKey)

	fmt.Println(globalSettings)

	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	http.HandleFunc("/", rootHandler)
	http.HandleFunc("/api/", apiHandler)

	log.Fatal(http.ListenAndServe(":8580", nil))
}


func loadTemplates() templateStore {
	base := template.Must(template.New("base").Parse(templates.Base))

	return templateStore{
		base: base,
	}
}

func extendTemplate(base *template.Template, s string) *template.Template {
	return template.Must(template.Must(base.Clone()).Parse(s))
}

func check(err error) {
	if err != nil {
		panic(err)
	}
}

func loadSettings() (settings, error) {
	raw, err := ioutil.ReadFile("./settings.json")
    if err != nil {
		return settings{}, err
    }

    var s settings
    err = json.Unmarshal(raw, &s)
    if err != nil {
		return settings{}, err
    }

	return s, nil
}

func rootHandler(w http.ResponseWriter, r *http.Request) {
	globalTemplateStore.base.Execute(w, nil)
}

func apiHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/api/login/" {
		apiLoginHandler(w, r)
	} else if r.URL.Path == "/api/new-job/" {
		apiNewJobHandler(w, r)
	} else if r.URL.Path == "/api/new-job/create/" {
		apiNewJobCreateHandler(w, r)
	} else if r.URL.Path == "/api/job-output/" {
		apiJobOutputHandler(w, r)
	} else {
		http.Error(w, "404 Not Found", http.StatusNotFound)
	}
}

func apiLoginHandler(w http.ResponseWriter, r *http.Request) {
	if !isValidPostJson(r) {
		http.Error(w, "400 Bad Request (method or content-type)", http.StatusBadRequest)
		return
	}

	decoder := json.NewDecoder(r.Body)
	var creds struct {
		Password string `json:"password"`
	}
	err := decoder.Decode(&creds)
	if err != nil {
		http.Error(w, "400 Bad Request (parsing body)", http.StatusBadRequest)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(globalSettings.Password), []byte(creds.Password))

	status := "success"
	var cookie *http.Cookie
	if err == nil {
		session := map[string]string{
			"authenticated": "true",
		}

		encoded, err := globalSecureCookie.Encode("session", session)
		if err != nil {
			http.Error(w, "500 Internal Server Error (could not encode session cookie)", http.StatusInternalServerError)
			return
		}

		cookie = &http.Cookie{
            Name:  "session",
            Value: encoded,
            Path:  "/",
			HttpOnly: true,
        }
	} else {
		status = "wrong_credentials"
	}

	result := struct {
		Status string `json:"status"`
	}{
		Status: status,
	}

	resultJson, err := json.Marshal(result)
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not encode json response)", http.StatusInternalServerError)
		return
	}

	if cookie != nil {
		http.SetCookie(w, cookie)
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(resultJson)
}

func apiNewJobHandler(w http.ResponseWriter, r *http.Request) {
	if !isAuthenticated(r) {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	result := struct {
		Status string `json:"status"`
	}{
		Status: "success",
	}

	resultJson, err := json.Marshal(result)
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not encode json response)", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(resultJson)
}

func apiNewJobCreateHandler(w http.ResponseWriter, r *http.Request) {
	type TomlConfigBasic struct {
		CaseId string `toml:"case_id"`
		PopSize int `toml:"pop_size"`
		NumGenerations int `toml:"num_generations"`
	}

	type TomlConfigComputation struct {
		DataFilePath string `toml:"data_file_path"`
	}

	type TomlConfig struct {
		Basic TomlConfigBasic `toml:"basic"`
		Computation TomlConfigComputation `toml:"computation"`
	}

	if !isAuthenticated(r) {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	if !isValidPostJson(r) {
		http.Error(w, "400 Bad Request (method or content-type)", http.StatusBadRequest)
		return
	}

	decoder := json.NewDecoder(r.Body)
	var data struct {
		PopSize string `json:"pop_size"`
		NumGenerations string `json:"num_generations"`
	}
	err := decoder.Decode(&data)
	if err != nil {
		http.Error(w, "400 Bad Request (parsing body)", http.StatusBadRequest)
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

	config := TomlConfig{
		Basic: TomlConfigBasic{
			CaseId: jobId,
			PopSize: 100,
			NumGenerations: 20,
		},
		Computation: TomlConfigComputation{
			DataFilePath: jobDir,
		},
	}

	configFilePath := filepath.Join(jobDir, "config.toml")
	configFile, err := os.Create(configFilePath)
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not create job config.toml file)", http.StatusInternalServerError)
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

	go func() {
		cmd := exec.Command("../mendel-go/mendel-go", "-f", configFilePath)
		stdout, err := cmd.StdoutPipe()
		if err != nil {
			fmt.Println(err)
		}

		err = cmd.Start()
		if err != nil {
			fmt.Println(err)
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
			fmt.Println(err)
		}

		globalRunningJobsLock.Lock()
		delete(globalRunningJobsOutput, jobId)

		outputFile, err := os.Create(filepath.Join(jobDir, "stdout.txt"))
		if err != nil {
			globalRunningJobsLock.Unlock()
			http.Error(w, "500 Internal Server Error (could not create job stdout.txt file)", http.StatusInternalServerError)
			return
		}

		outputFile.WriteString(outputBuilder.String());
		outputFile.Close()
		globalRunningJobsLock.Unlock()
	}()

	result := struct {
		JobId string `json:"job_id"`
	}{
		JobId: jobId,
	}

	resultJson, err := json.Marshal(result)
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not encode json response)", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(resultJson)
}

func apiJobOutputHandler(w http.ResponseWriter, r *http.Request) {
	if !isAuthenticated(r) {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	jobId := r.URL.Query().Get("jobId")
	offset, err := strconv.Atoi(r.URL.Query().Get("offset"))
	if err != nil {
		http.Error(w, "400 Bad Request (cannot convert offset to int)", http.StatusBadRequest)
		return
	}

	jobDir := filepath.Join(globalJobsDir, jobId)

	globalRunningJobsLock.RLock()
	output, inProgress := globalRunningJobsOutput[jobId]

	result := struct {
		Output string `json:"output"`
		Done bool `json:"done"`
	}{
		Output: "",
		Done: !inProgress,
	}

	if inProgress {
		result.Output = output.String()[offset:]
	} else {
		bytes, err := ioutil.ReadFile(filepath.Join(jobDir, "stdout.txt"))
		if err != nil {
			globalRunningJobsLock.RUnlock()
			http.Error(w, "500 Internal Server Error (could not read stdout.txt)", http.StatusInternalServerError)
			return
		}
		result.Output = string(bytes)[offset:]
	}
	globalRunningJobsLock.RUnlock()

	resultJson, err := json.Marshal(result)
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not encode json response)", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(resultJson)
}

func isValidPostJson(r *http.Request) bool {
	if r.Method != "POST" {
		return false
	}

	val, ok := r.Header["Content-Type"]

	if !ok || len(val) == 0 || val[0] != "application/json" {
		return false
	}

	return true
}

func isAuthenticated(r *http.Request) bool {
	cookie, err := r.Cookie("session")
	if err != nil {
		return false
	}

	session := make(map[string]string)
	err = globalSecureCookie.Decode("session", cookie.Value, &session)
	if err != nil {
		return false
	}

	val, ok := session["authenticated"]
	return ok && val == "true"
}

func generateUuid() (string, error) {
	bytes := make([]byte, 16)

	_, err := rand.Read(bytes);
	if err != nil {
		return "", err
	}

	return hex.EncodeToString(bytes), nil
}
