package main

import (
	"log"
	"net/http"
	"html/template"
	"io/ioutil"
	"encoding/json"
	"fmt"
	"golang.org/x/crypto/bcrypt"
	"github.com/gorilla/securecookie"
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


func main() {
	var err error

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
