package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
	"golang.org/x/crypto/bcrypt"
	"github.com/gorilla/securecookie"
)

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

var globalBaseTemplateParsed *template.Template
var globalDb Database
var globalDbLock sync.RWMutex
var globalSecureCookie *securecookie.SecureCookie
var globalRunningJobsOutput map[string]*strings.Builder
var globalRunningJobsLock sync.RWMutex
var globalJobsDir string = "./output/jobs"


func main() {
	globalRunningJobsOutput = make(map[string]*strings.Builder)

	globalBaseTemplateParsed = template.Must(template.New("base").Parse(baseTemplate))
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

func rootHandler(w http.ResponseWriter, r *http.Request) {
	type Context struct {
		CssFiles []string
		JsFiles []string
	}

	context := Context{
		CssFiles: []string{
			staticMtime("static/css/main.css"),
			staticMtime("static/css/button.css"),
			staticMtime("static/css/snackbar.css"),
			staticMtime("static/css/non_login.css"),
			staticMtime("static/css/header.css"),
			staticMtime("static/css/login.css"),
			staticMtime("static/css/new_job.css"),
			staticMtime("static/css/job_detail.css"),
			staticMtime("static/css/job_listing.css"),
			staticMtime("static/css/user_listing.css"),
			staticMtime("static/css/create_edit_user.css"),
			staticMtime("static/css/plots.css"),
			staticMtime("static/css/confirmation_dialog.css"),
		},
		JsFiles: []string{
			staticMtime("static/js/bundle.js"),
		},
	}

	globalBaseTemplateParsed.Execute(w, context)
}

func apiHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/api/login/" {
		apiLoginHandler(w, r)
	} else if r.URL.Path == "/api/logout/" {
		apiLogoutHandler(w, r)
	} else if r.URL.Path == "/api/get-current-user/" {
		apiGetCurrentUserHandler(w, r)
	} else if r.URL.Path == "/api/create-job/" {
		apiCreateJobHandler(w, r)
	} else if r.URL.Path == "/api/job-output/" {
		apiJobOutputHandler(w, r)
	} else if r.URL.Path == "/api/job-list/" {
		apiJobListHandler(w, r)
	} else if r.URL.Path == "/api/user-list/" {
		apiUserListHandler(w, r)
	} else if r.URL.Path == "/api/create-edit-user/" {
		apiCreateEditUserHandler(w, r)
	} else if r.URL.Path == "/api/delete-user/" {
		apiDeleteUserHandler(w, r)
	} else if r.URL.Path == "/api/get-user/" {
		apiGetUserHandler(w, r)
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

func writeJsonResponse(w http.ResponseWriter, data interface{}) {
	dataJson, err := json.Marshal(data)
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not encode json response)", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(dataJson)
}
