package main

import (
	"strings"
	"log"
	"net/http"
	"html/template"
	"io/ioutil"
	"encoding/json"
	"fmt"
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

func main() {
	var err error

	globalTemplateStore = loadTemplates()
	globalSettings, err := loadSettings()
	check(err)

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
	urlParts := strings.Split(r.URL.Path, "/")

	if urlParts[1] == "new-job" {
		apiNewJobHandler(w, r)
	} else {
		http.Error(w, "404 Not Found", http.StatusNotFound)
	}
}

func apiNewJobHandler(w http.ResponseWriter, r *http.Request) {
	result := struct {
		Status string `json:"status"`
	}{
		Status: "login",
	}

	resultJson, err := json.Marshal(result)
	check(err)

	w.Header().Set("Content-Type", "application/json")
	w.Write(resultJson)
}
