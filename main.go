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
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
	"golang.org/x/crypto/bcrypt"
	"github.com/gorilla/securecookie"
	"github.com/BurntSushi/toml"
	"github.com/genetic-algorithms/mendel-web-example/templates"
)

type templateStore struct {
	base *template.Template
}

type JobMetaData struct {
	Version int `json:"version"`
	JobId string `json:"job_id"`
	Time time.Time `json:"time"`
	Title string `json:"title"`
}

type Database struct {
	Version int `json:"version"`
	CookieHashKey []byte `json:"cookie_hash_key"`
	CookieBlockKey []byte `json:"cookie_block_key"`
	Jobs map[string]DatabaseJob `json:"jobs"`
	Users map[string]DatabaseUser `json:"users"`
}

type DatabaseJob struct {
	Id string `json:"id"`
	Time time.Time `json:"time"`
	Title string `json:"title"`
	OwnerId string `json:"owner_id"`
	Status string `json:"status"` // running, cancelled, failed, succeeded
}

type DatabaseUser struct {
	Id string `json:"id"`
	Username string `json:"username"`
	Password []byte `json:"password"`
	IsAdmin bool `json:"is_admin"`
}

var globalTemplateStore templateStore
var globalDb Database
var globalDbLock sync.RWMutex
var globalSecureCookie *securecookie.SecureCookie
var globalRunningJobsOutput map[string]*strings.Builder
var globalRunningJobsLock sync.RWMutex
var globalJobsDir string = "./output/jobs"


func main() {
	globalRunningJobsOutput = make(map[string]*strings.Builder)

	globalTemplateStore = loadTemplates()
	globalDb = loadDatabase()

	globalSecureCookie = securecookie.New(globalDb.CookieHashKey, globalDb.CookieBlockKey)

	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	http.HandleFunc("/", rootHandler)
	http.HandleFunc("/api/", apiHandler)

	log.Fatal(http.ListenAndServe(":8580", nil))
}

func loadDatabase() Database {
	_, err := os.Stat("./database")
	if err != nil {
		err = os.Mkdir("./database", 0755)
		if err != nil {
			panic(err)
		}
	}

	_, err = os.Stat("./database/database.json")
	if err != nil {
		cookieHashKey := make([]byte, 64)
		_, err = rand.Read(cookieHashKey);
		if err != nil {
			panic(err)
		}

		cookieBlockKey := make([]byte, 32)
		_, err = rand.Read(cookieBlockKey);
		if err != nil {
			panic(err)
		}

		dbUserId, err := generateUuid()
		if err != nil {
			panic(err)
		}
		dbUserPassword, err := generateUuid()
		if err != nil {
			panic(err)
		}
		dbUserPasswordHash, err := bcrypt.GenerateFromPassword([]byte(dbUserPassword), bcrypt.DefaultCost)
		if err != nil {
			panic(err)
		}

		dbUser := DatabaseUser{
			Id: dbUserId,
			Username: "admin",
			Password: dbUserPasswordHash,
			IsAdmin: true,
		}

		dbUsers := make(map[string]DatabaseUser)
		dbUsers[dbUser.Id] = dbUser

		db := Database{
			Version: 1,
			CookieHashKey: cookieHashKey,
			CookieBlockKey: cookieBlockKey,
			Jobs: make(map[string]DatabaseJob),
			Users: dbUsers,
		}

		dbJson, err := json.Marshal(db)
		if err != nil {
			panic(err)
		}

		err = ioutil.WriteFile("./database/database.json", dbJson, 0644)
		if err != nil {
			panic(err)
		}

		fmt.Println("Initialized database")
		fmt.Println("Username:", dbUser.Username)
		fmt.Println("Password:", dbUserPassword)

		return db
	}

	bytes, err := ioutil.ReadFile("./database/database.json")
	if err != nil {
		panic(err)
	}

	var db Database
	err = json.Unmarshal(bytes, &db)
	if err != nil {
		panic(err)
	}

	return db
}

func loadTemplates() templateStore {
	base := template.Must(template.New("base").Parse(templates.Base))

	return templateStore{
		base: base,
	}
}

func rootHandler(w http.ResponseWriter, r *http.Request) {
	type Context struct {
		CssFiles []string
		JsFiles []string
	}

	context := Context{
		CssFiles: []string{
			staticMtime("static/css/main.css"),
			staticMtime("static/css/button.css"),
			staticMtime("static/css/header.css"),
			staticMtime("static/css/login.css"),
			staticMtime("static/css/new_job.css"),
			staticMtime("static/css/job_detail.css"),
			staticMtime("static/css/job_listing.css"),
			staticMtime("static/css/plots.css"),
		},
		JsFiles: []string{
			staticMtime("static/js/bundle.js"),
		},
	}

	globalTemplateStore.base.Execute(w, context)
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
	} else if r.URL.Path == "/api/job-list/" {
		apiJobListHandler(w, r)
	} else if r.URL.Path == "/api/plot-average-mutations/" {
		apiPlotAverageMutationsHandler(w, r)
	} else if r.URL.Path == "/api/plot-fitness-history/" {
		apiPlotFitnessHistoryHandler(w, r)
	} else if r.URL.Path == "/api/plot-deleterious-mutations/" {
		apiPlotDeleteriousMutationsHandler(w, r)
	} else if r.URL.Path == "/api/plot-beneficial-mutations/" {
		apiPlotBeneficialMutationsHandler(w, r)
	} else if r.URL.Path == "/api/plot-snp-frequencies/" {
		apiPlotSnpFrequenciesHandler(w, r)
	} else if r.URL.Path == "/api/plot-minor-allele-frequencies/" {
		apiPlotMinorAlleleFrequenciesHandler(w, r)
	} else {
		http.Error(w, "404 Not Found", http.StatusNotFound)
	}
}

func apiLoginHandler(w http.ResponseWriter, r *http.Request) {
	type JsonResponse struct {
		Status string `json:"status"`
	}

	if !isValidPostJson(r) {
		http.Error(w, "400 Bad Request (method or content-type)", http.StatusBadRequest)
		return
	}

	decoder := json.NewDecoder(r.Body)
	var creds struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	err := decoder.Decode(&creds)
	if err != nil {
		http.Error(w, "400 Bad Request (parsing body)", http.StatusBadRequest)
		return
	}

	globalDbLock.RLock()
	user := DatabaseUser{}
	for _, u := range globalDb.Users {
		if u.Username == creds.Username {
			user = u
			break
		}
	}
	globalDbLock.RUnlock()

	if user.Id == "" {
		responseJson, _ := json.Marshal(JsonResponse{Status: "wrong_credentials"})
		w.Header().Set("Content-Type", "application/json")
		w.Write(responseJson)
		return
	}

	err = bcrypt.CompareHashAndPassword(user.Password, []byte(creds.Password))
	if err != nil {
		responseJson, _ := json.Marshal(JsonResponse{Status: "wrong_credentials"})
		w.Header().Set("Content-Type", "application/json")
		w.Write(responseJson)
		return
	}

	session := map[string]string{
		"authenticated_user_id": user.Id,
	}

	encoded, err := globalSecureCookie.Encode("session", session)
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not encode session cookie)", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:  "session",
		Value: encoded,
		Path:  "/",
		HttpOnly: true,
	})

	responseJson, err := json.Marshal(JsonResponse{Status: "success"})
	w.Header().Set("Content-Type", "application/json")
	w.Write(responseJson)
}

func apiNewJobHandler(w http.ResponseWriter, r *http.Request) {
	user := getAuthenticatedUser(r)
	if user.Id == "" {
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
		Title string `json:"title"`
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
		Title: data.Title,
		OwnerId: user.Id,
		Status: "running",
	}

	globalDbLock.Lock()
	globalDb.Jobs[jobId] = job
	globalDbLock.Unlock()

	go func() {
		cmd := exec.Command("../mendel-go/mendel-go", "-f", configFilePath)
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
	user := getAuthenticatedUser(r)
	if user.Id == "" {
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
		bytes, err := ioutil.ReadFile(filepath.Join(jobDir, "mendel_go.out"))
		if err != nil {
			globalRunningJobsLock.RUnlock()
			http.Error(w, "500 Internal Server Error (could not read mendel_go.out)", http.StatusInternalServerError)
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

func apiJobListHandler(w http.ResponseWriter, r *http.Request) {
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	jobs := []DatabaseJob{}
	globalDbLock.RLock()
	for _, job := range globalDb.Jobs {
		jobs = append(jobs, job)
	}
	globalDbLock.RUnlock()

	sort.Slice(jobs, func(i, j int) bool {
		return jobs[i].Time.After(jobs[j].Time)
	})

	result := struct {
		Jobs []DatabaseJob `json:"jobs"`
	}{
		Jobs: jobs,
	}

	resultJson, err := json.Marshal(result)
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not encode json response)", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(resultJson)
}

func apiPlotAverageMutationsHandler(w http.ResponseWriter, r *http.Request) {
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	jobId := r.URL.Query().Get("jobId")

	globalRunningJobsLock.RLock()
	bytes, err := ioutil.ReadFile(filepath.Join(globalJobsDir, jobId, "mendel.hst"))
	globalRunningJobsLock.RUnlock()

    if err != nil {
		http.Error(w, "500 Internal Server Error (could not open mendel.hst)", http.StatusInternalServerError)
		return
    }

	rows := parseSpaceSeparatedPlotFile(bytes)

	result := struct {
		Generations []int `json:"generations"`
		Deleterious []float64 `json:"deleterious"`
		Neutral []float64 `json:"neutral"`
		Favorable []float64 `json:"favorable"`
	}{
		Generations: []int{},
		Deleterious: []float64{},
		Neutral: []float64{},
		Favorable: []float64{},
	}

	for _, columns := range rows {
		if len(columns) < 4 {
			log.Println("not enough columns")
			continue
		}

		n, err := strconv.Atoi(columns[0])
		if err != nil {
			log.Println("cannot parse int:", columns[0])
		} else {
			result.Generations = append(result.Generations, n)
		}

		f, err := strconv.ParseFloat(columns[1], 64)
		if err != nil {
			log.Println("cannot parse float64:", columns[1])
		} else {
			result.Deleterious = append(result.Deleterious, f)
		}

		f, err = strconv.ParseFloat(columns[2], 64)
		if err != nil {
			log.Println("cannot parse float64:", columns[2])
		} else {
			result.Neutral = append(result.Neutral, f)
		}

		f, err = strconv.ParseFloat(columns[3], 64)
		if err != nil {
			log.Println("cannot parse float64:", columns[3])
		} else {
			result.Favorable = append(result.Favorable, f)
		}
	}

	resultJson, err := json.Marshal(result)
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not encode json response)", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(resultJson)
}

func apiPlotFitnessHistoryHandler(w http.ResponseWriter, r *http.Request) {
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	jobId := r.URL.Query().Get("jobId")

	globalRunningJobsLock.RLock()
	bytes, err := ioutil.ReadFile(filepath.Join(globalJobsDir, jobId, "mendel.fit"))
	globalRunningJobsLock.RUnlock()

    if err != nil {
		http.Error(w, "500 Internal Server Error (could not open mendel.hst)", http.StatusInternalServerError)
		return
    }

	rows := parseSpaceSeparatedPlotFile(bytes)

	result := struct {
		Generations []int `json:"generations"`
		PopSize []int `json:"pop_size"`
		Fitness []float64 `json:"fitness"`
	}{
		Generations: []int{},
		PopSize: []int{},
		Fitness: []float64{},
	}

	for _, columns := range rows {
		if len(columns) < 4 {
			log.Println("not enough columns")
			continue
		}

		n, err := strconv.Atoi(columns[0])
		if err != nil {
			log.Println("cannot parse int:", columns[0])
		} else {
			result.Generations = append(result.Generations, n)
		}

		n, err = strconv.Atoi(columns[1])
		if err != nil {
			log.Println("cannot parse int:", columns[1])
		} else {
			result.PopSize = append(result.PopSize, n)
		}

		f, err := strconv.ParseFloat(columns[3], 64)
		if err != nil {
			log.Println("cannot parse float64:", columns[3])
		} else {
			result.Fitness = append(result.Fitness, f)
		}
	}

	resultJson, err := json.Marshal(result)
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not encode json response)", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(resultJson)
}

func apiPlotDeleteriousMutationsHandler(w http.ResponseWriter, r *http.Request) {
	type GenerationData struct {
		Generation int `json:"generation"`
		BinMidpointFitness []float64 `json:"binmidpointfitness"`
		Dominant []float64 `json:"dominant"`
		Recessive []float64 `json:"recessive"`
	}

	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	jobId := r.URL.Query().Get("jobId")

	globalRunningJobsLock.RLock()
	fileInfos, err := ioutil.ReadDir(filepath.Join(globalJobsDir, jobId, "allele-distribution-del"))

    if err != nil {
		globalRunningJobsLock.RUnlock()
		http.Error(w, "500 Internal Server Error (could not list allele-distribution-del directory)", http.StatusInternalServerError)
		return
    }

	result := []GenerationData{}
	for _, fileInfo := range fileInfos {
		fileName := fileInfo.Name()

		if strings.HasSuffix(fileName, ".json") {
			bytes, err := ioutil.ReadFile(filepath.Join(globalJobsDir, jobId, "allele-distribution-del", fileName))
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

	resultJson, err := json.Marshal(result)
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not encode json response)", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(resultJson)
}

func apiPlotBeneficialMutationsHandler(w http.ResponseWriter, r *http.Request) {
	type GenerationData struct {
		Generation int `json:"generation"`
		BinMidpointFitness []float64 `json:"binmidpointfitness"`
		Dominant []float64 `json:"dominant"`
		Recessive []float64 `json:"recessive"`
	}

	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	jobId := r.URL.Query().Get("jobId")

	globalRunningJobsLock.RLock()
	fileInfos, err := ioutil.ReadDir(filepath.Join(globalJobsDir, jobId, "allele-distribution-fav"))

    if err != nil {
		globalRunningJobsLock.RUnlock()
		http.Error(w, "500 Internal Server Error (could not list allele-distribution-fav directory)", http.StatusInternalServerError)
		return
    }

	result := []GenerationData{}
	for _, fileInfo := range fileInfos {
		fileName := fileInfo.Name()

		if strings.HasSuffix(fileName, ".json") {
			bytes, err := ioutil.ReadFile(filepath.Join(globalJobsDir, jobId, "allele-distribution-fav", fileName))
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

	resultJson, err := json.Marshal(result)
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not encode json response)", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(resultJson)
}

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

	resultJson, err := json.Marshal(result)
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not encode json response)", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(resultJson)
}

func apiPlotMinorAlleleFrequenciesHandler(w http.ResponseWriter, r *http.Request) {
	type GenerationData struct {
		Generation int `json:"generation"`
		Bins []int `json:"bins"`
		Deleterious []float64 `json:"deleterious"`
		Neutral []float64 `json:"neutral"`
		Favorable []float64 `json:"favorable"`
		DelInitialAlleles []float64 `json:"delInitialAlleles"`
		FavInitialAlleles []float64 `json:"favInitialAlleles"`
	}

	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	jobId := r.URL.Query().Get("jobId")

	globalRunningJobsLock.RLock()
	fileInfos, err := ioutil.ReadDir(filepath.Join(globalJobsDir, jobId, "normalized-allele-bins"))

    if err != nil {
		globalRunningJobsLock.RUnlock()
		http.Error(w, "500 Internal Server Error (could not list normalized-allele-bins directory)", http.StatusInternalServerError)
		return
    }

	result := []GenerationData{}
	for _, fileInfo := range fileInfos {
		fileName := fileInfo.Name()

		if strings.HasSuffix(fileName, ".json") {
			bytes, err := ioutil.ReadFile(filepath.Join(globalJobsDir, jobId, "normalized-allele-bins", fileName))
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

	resultJson, err := json.Marshal(result)
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not encode json response)", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(resultJson)
}

func parseSpaceSeparatedPlotFile(bytes []byte) [][]string {
	lines := strings.Split(string(bytes), "\n")

	numberLines := [][]string{}
	for _, line := range lines {
		if line != "" && !strings.HasPrefix(line, "#") {
			numberLines = append(numberLines, strings.Fields(line))
		}
	}

	return numberLines
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

func getAuthenticatedUser(r *http.Request) DatabaseUser {
	cookie, err := r.Cookie("session")
	if err != nil {
		return DatabaseUser{}
	}

	session := make(map[string]string)
	err = globalSecureCookie.Decode("session", cookie.Value, &session)
	if err != nil {
		return DatabaseUser{}
	}

	user_id, ok := session["authenticated_user_id"]
	if !ok {
		return DatabaseUser{}
	}

	globalDbLock.RLock()
	user, ok := globalDb.Users[user_id]
	globalDbLock.RUnlock()
	if !ok {
		return DatabaseUser{}
	}

	return user
}

func generateUuid() (string, error) {
	bytes := make([]byte, 16)

	_, err := rand.Read(bytes);
	if err != nil {
		return "", err
	}

	return hex.EncodeToString(bytes), nil
}

func staticMtime(path string) string {
	fileInfo, err := os.Stat(path)
	if err != nil {
		log.Println("cannot stat file", path)
	}

	return fmt.Sprint("/", path, "?v=", fileInfo.ModTime().Unix())
}

func persistDatabase() error {
	dbJson, err := json.Marshal(globalDb)
	if err != nil {
		return err
	}

	return ioutil.WriteFile("./database/database.json", dbJson, 0644)
}
