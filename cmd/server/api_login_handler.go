package main

import (
	"encoding/json"
	"net/http"
	"golang.org/x/crypto/bcrypt"
)

func apiLoginHandler(w http.ResponseWriter, r *http.Request) {
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
		responseJson, _ := json.Marshal(map[string]string{"status": "wrong_credentials"})
		w.Header().Set("Content-Type", "application/json")
		w.Write(responseJson)
		return
	}

	err = bcrypt.CompareHashAndPassword(user.Password, []byte(creds.Password))
	if err != nil {
		responseJson, _ := json.Marshal(map[string]string{"status": "wrong_credentials"})
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

	responseJson, err := json.Marshal(map[string]interface{}{
		"status": "success",
		"user": map[string]interface{}{
			"id": user.Id,
			"username": user.Username,
			"is_admin": user.IsAdmin,
		},
	})
	w.Header().Set("Content-Type", "application/json")
	w.Write(responseJson)
}
