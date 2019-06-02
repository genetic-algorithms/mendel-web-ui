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
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/securecookie"
	"golang.org/x/crypto/bcrypt"
)

/*
The main of the web ui server.
*/

type Database struct {
	Version        int                     `json:"version"`
	CookieHashKey  []byte                  `json:"cookie_hash_key"`
	CookieBlockKey []byte                  `json:"cookie_block_key"`
	Jobs           map[string]DatabaseJob  `json:"jobs"`
	Users          map[string]DatabaseUser `json:"users"`
}

type DatabaseJob struct {
	Id          string    `json:"id"`
	Description string    `json:"description"` // this is cached in the db from the job config
	Time        time.Time `json:"time"`
	OwnerId     string    `json:"owner_id"`
	Status      string    `json:"status"` // running, cancelled, failed, succeeded
}

type DatabaseUser struct {
	Id       string `json:"id"`
	Username string `json:"username"`
	Password []byte `json:"password"`
	IsAdmin  bool   `json:"is_admin"`
}

// These global vars are necessary because the handler functions are not given any context
var globalBaseTemplateParsed *template.Template
var globalDb Database
var globalDbLock sync.RWMutex
var globalSecureCookie *securecookie.SecureCookie
var globalRunningJobsOutput map[string]*strings.Builder
var globalRunningJobsLock sync.RWMutex
var globalJobsDir = "output/jobs"
var globalMendelGoBinaryPath string
var globalDefaultConfigPath string
var globalStaticPath string

func main() {
	if len(os.Args) < 4 {
		fmt.Println("Usage: ./cmd/server/mendel-web-ui port mendel-go-binary default_config [static_dir]")
		return
	}

	port := os.Args[1]
	globalMendelGoBinaryPath = os.Args[2]
	globalDefaultConfigPath = os.Args[3]
	globalStaticPath = "static"
	if len(os.Args) >= 5 {
		globalStaticPath = strings.TrimSuffix(os.Args[4], "/") // make sure it does not have a trailing / because we combine it with a path
		_, err := os.Stat(globalStaticPath)
		if err != nil {
			panic(err)
		}
		fmt.Printf("Using static directory %s\n", globalStaticPath)
	}

	globalRunningJobsOutput = make(map[string]*strings.Builder)

	globalBaseTemplateParsed = template.Must(template.New("base").Parse(baseTemplate))
	globalDb = loadDatabase()

	globalSecureCookie = securecookie.New(globalDb.CookieHashKey, globalDb.CookieBlockKey)

	/*
		There are 3 routes this web ui server responds to:
			- /static/*: request from browser for css files and bundle.js (all of our typescript compiled to javascript)
			- /api/*: requests from browser for data (users, jobs, plot file data, etc.)
			- /*: request for the initial page (exact content sent depends on the rest of the url)
	*/
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir(globalStaticPath))))

	http.HandleFunc("/", rootHandler)
	http.HandleFunc("/api/", apiHandler)

	log.Fatal(http.ListenAndServe(":"+port, nil))
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
		_, err = rand.Read(cookieHashKey)
		if err != nil {
			panic(err)
		}

		cookieBlockKey := make([]byte, 32)
		_, err = rand.Read(cookieBlockKey)
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
			Id:       dbUserId,
			Username: "admin",
			Password: dbUserPasswordHash,
			IsAdmin:  true,
		}

		dbUsers := make(map[string]DatabaseUser)
		dbUsers[dbUser.Id] = dbUser

		db := Database{
			Version:        1,
			CookieHashKey:  cookieHashKey,
			CookieBlockKey: cookieBlockKey,
			Jobs:           make(map[string]DatabaseJob),
			Users:          dbUsers,
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

// Responds to / or any other route (except api or static) with the same single app page
// (but customized to the virtual page indicated by the rest of the route)
func rootHandler(w http.ResponseWriter, _ *http.Request) {
	type Context struct {
		CssFiles []string
		JsFiles  []string
	}

	context := Context{
		CssFiles: []string{
			staticMtime("css/main.css"),
			staticMtime("css/button.css"),
			staticMtime("css/snackbar.css"),
			staticMtime("css/non_login.css"),
			staticMtime("css/header.css"),
			staticMtime("css/login.css"),
			staticMtime("css/new_job.css"),
			staticMtime("css/job_detail.css"),
			staticMtime("css/job_listing.css"),
			staticMtime("css/user_listing.css"),
			staticMtime("css/create_edit_user.css"),
			staticMtime("css/plots.css"),
			staticMtime("css/confirmation_dialog.css"),
			staticMtime("css/msg_dialog.css"),
		},
		JsFiles: []string{
			staticMtime("js/bundle.js"),
		},
	}

	globalBaseTemplateParsed.Execute(w, context)
}

// API routes that the front end javascript calls to get data like users, jobs, plot data
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
	} else if r.URL.Path == "/api/delete-job/" {
		apiDeleteJobHandler(w, r)
	} else if r.URL.Path == "/api/user-list/" {
		apiUserListHandler(w, r)
	} else if r.URL.Path == "/api/create-edit-user/" {
		apiCreateEditUserHandler(w, r)
	} else if r.URL.Path == "/api/delete-user/" {
		apiDeleteUserHandler(w, r)
	} else if r.URL.Path == "/api/get-user/" {
		apiGetUserHandler(w, r)
	} else if r.URL.Path == "/api/get-versions/" {
		apiGetVersionsHandler(w, r)
	} else if r.URL.Path == "/api/default-config/" {
		apiGetDefaultConfigHandler(w, r)
	} else if r.URL.Path == "/api/job-config/" {
		apiGetJobConfigHandler(w, r)
	} else if r.URL.Path == "/api/export-job/" {
		apiExportJobHandler(w, r)
	} else if r.URL.Path == "/api/import-job/" {
		apiImportJobHandler(w, r)
	} else if r.URL.Path == "/api/job-plot-files/" {
		apiJobPlotFilesHandler(w, r)
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

// Used to generate ids to store users in the db with
func generateUuid() (string, error) {
	bytes := make([]byte, 16) // 32 hex chars

	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}

	return hex.EncodeToString(bytes), nil
}

// Used to generate the id for each job run
func generateJobId() (string, error) {
	bytes := make([]byte, 4) // 8 hex chars

	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}

	//todo: check to see if this id is already in the db, and generate another one if it is
	return hex.EncodeToString(bytes), nil
}

func staticMtime(path string) string {
	fullPath := filepath.Join(globalStaticPath, path)
	fileInfo, err := os.Stat(fullPath)
	if err != nil {
		log.Println("cannot stat file", fullPath)
	}

	return fmt.Sprint("/static/", path, "?v=", fileInfo.ModTime().Unix())
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
