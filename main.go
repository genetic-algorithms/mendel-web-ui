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

type settings struct {
	CookieHashKey []byte `json:"cookie_hash_key"`
	CookieBlockKey []byte `json:"cookie_block_key"`
	CsrfKey []byte `json:"csrf_key"`
	Password string `json:"password"`
}

type templateStore struct {
	base *template.Template
}

type JobMetaData struct {
	Version int `json:"version"`
	JobId string `json:"job_id"`
	Time time.Time `json:"time"`
	Title string `json:"title"`
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
	if !isAuthenticated(r) {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	if !isValidPostJson(r) {
		http.Error(w, "400 Bad Request (method or content-type)", http.StatusBadRequest)
		return
	}

	decoder := json.NewDecoder(r.Body)
	decoder.UseNumber()
	var data struct {
		Title string `json:"title"`
		Config map[string]map[string]interface{} `json:"config"`
	}
	err := decoder.Decode(&data)
	if err != nil {
		http.Error(w, "400 Bad Request (parsing body)", http.StatusBadRequest)
		return
	}

	// Convert json.Number instances to int64 or float64
	for _, v1 := range data.Config {
		for k2, v2 := range v1 {
			number, ok := v2.(json.Number)
			if ok {
				i, err := number.Int64()
				if err != nil {
					f, err := number.Float64()
					if err == nil {
						v1[k2] = f
					}
				} else {
					v1[k2] = i
				}
			}
		}
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

	data.Config["basic"]["case_id"] = jobId
	data.Config["computation"]["data_file_path"] = jobDir

	configFilePath := filepath.Join(jobDir, "mendel_go.toml")
	configFile, err := os.Create(configFilePath)
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not create job mendel_go.toml file)", http.StatusInternalServerError)
		return
	}

	err = toml.NewEncoder(configFile).Encode(data.Config)
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

		err = ioutil.WriteFile(filepath.Join(jobDir, "mendel_go.out"), []byte(outputBuilder.String()), 0644)
		if err != nil {
			globalRunningJobsLock.Unlock()
			http.Error(w, "500 Internal Server Error (could not write to mendel_go.out file)", http.StatusInternalServerError)
			return
		}

		metaData := JobMetaData{
			Version: 1,
			JobId: jobId,
			Time: time.Now().UTC(),
			Title: data.Title,
		}
		metaDataJson, err := json.Marshal(metaData)
		if err != nil {
			globalRunningJobsLock.Unlock()
			http.Error(w, "500 Internal Server Error (could not encode metadata json)", http.StatusInternalServerError)
			return
		}

		err = ioutil.WriteFile(filepath.Join(jobDir, "metadata.json"), metaDataJson, 0644)
		if err != nil {
			globalRunningJobsLock.Unlock()
			http.Error(w, "500 Internal Server Error (could not write to metadata.json file)", http.StatusInternalServerError)
			return
		}

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
	if !isAuthenticated(r) {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	globalRunningJobsLock.RLock()
	fileInfos, err := ioutil.ReadDir(globalJobsDir)
	if err != nil {
		globalRunningJobsLock.RUnlock()
		http.Error(w, "500 Internal Server Error (could not read jobs directory)", http.StatusInternalServerError)
		return
	}

	type JobInfo struct {
		JobId string `json:"job_id"`
		Title string `json:"title"`
		Time time.Time `json:"time"`
		Done bool `json:"done"`
	}

	jobInfos := []JobInfo{}

	for _, fileInfo := range fileInfos {
		if !fileInfo.IsDir() {
			continue
		}

		jobId := fileInfo.Name()
		_, inProgress := globalRunningJobsOutput[jobId]

		rawMetaData, err := ioutil.ReadFile(filepath.Join(globalJobsDir, jobId, "metadata.json"))
		if err != nil {
			log.Println("cannot read metadata.json for job:", jobId)
			continue
		}

		var metaData JobMetaData
		err = json.Unmarshal(rawMetaData, &metaData)
		if err != nil {
			log.Println("cannot parse metadata.json for job:", jobId)
			continue
		}

		jobInfos = append(jobInfos, JobInfo{
			JobId: metaData.JobId,
			Title: metaData.Title,
			Time: metaData.Time,
			Done: !inProgress,
		})

		sort.Slice(jobInfos, func(i, j int) bool {
			return jobInfos[i].Time.After(jobInfos[j].Time)
		})
	}
	globalRunningJobsLock.RUnlock()

	result := struct {
		Jobs []JobInfo `json:"jobs"`
	}{
		Jobs: jobInfos,
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
	if !isAuthenticated(r) {
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
	if !isAuthenticated(r) {
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

	if !isAuthenticated(r) {
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

	if !isAuthenticated(r) {
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

	if !isAuthenticated(r) {
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

	if !isAuthenticated(r) {
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

func staticMtime(path string) string {
	fileInfo, err := os.Stat(path)
	if err != nil {
		fmt.Println("cannot stat file", path)
	}

	return fmt.Sprint("/", path, "?v=", fileInfo.ModTime().Unix())
}
