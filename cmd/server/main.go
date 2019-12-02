package main

import (
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/db"
	"github.com/gorilla/securecookie"
)

/*
The main of the web ui server.
*/

// These global vars are necessary because the handler functions are not given any context
var globalBaseTemplateParsed *template.Template
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
	dbPath := "./database/database.json"
	db.DatabaseFactory(dbPath, true) // creates a new db or populates the db.Db singleton object with the current db file content

	globalSecureCookie = securecookie.New(db.Db.Data.CookieHashKey, db.Db.Data.CookieBlockKey)

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
} // end of main

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

	err := globalBaseTemplateParsed.Execute(w, context)
	if err != nil {
		panic(err)
	}
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

func getAuthenticatedUser(r *http.Request) db.DatabaseUser {
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

	db.Db.RLock()
	user, ok := db.Db.Data.Users[user_id]
	db.Db.RUnlock()
	if !ok {
		return DatabaseUser{}
	}

	return user
}

func staticMtime(path string) string {
	fullPath := filepath.Join(globalStaticPath, path)
	fileInfo, err := os.Stat(fullPath)
	if err != nil {
		log.Println("cannot stat file", fullPath)
	}

	return fmt.Sprint("/static/", path, "?v=", fileInfo.ModTime().Unix())
}
