package main

import (
	"encoding/json"
	"net/http"
	"golang.org/x/crypto/bcrypt"
)

func apiCreateEditUserHandler(w http.ResponseWriter, r *http.Request) {
	type PostUser struct {
		Id string `json:"id"`
		Username string `json:"username"`
		Password string `json:"password"`
		IsAdmin bool `json:"is_admin"`
	}

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
	var postUser PostUser
	err := decoder.Decode(&postUser)
	if err != nil {
		http.Error(w, "400 Bad Request (parsing body)", http.StatusBadRequest)
		return
	}

	usernameExists := false
	globalDbLock.RLock()
	for _, u := range globalDb.Users {
		if u.Username == postUser.Username && u.Id != postUser.Id {
			usernameExists = true
			break
		}
	}
	globalDbLock.RUnlock()

	if usernameExists {
		writeJsonResponse(w, map[string]string{
			"status": "username_exists",
		})
		return
	}

	hashedPassword := []byte{}
	if postUser.Password != "" {
		hashedPassword, err = bcrypt.GenerateFromPassword([]byte(postUser.Password), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "500 Internal Server Error (could not hash password)", http.StatusInternalServerError)
			return
		}
	}

	var newUser DatabaseUser
	if postUser.Id == "" {
		// Create user

		if !user.IsAdmin {
			http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
			return
		}

		userId, err := generateUuid()
		if err != nil {
			http.Error(w, "500 Internal Server Error (could not generate userId)", http.StatusInternalServerError)
			return
		}

		newUser = DatabaseUser{
			Id: userId,
			Username: postUser.Username,
			Password: hashedPassword,
			IsAdmin: postUser.IsAdmin,
		}
	} else {
		// Edit user

		if !(user.IsAdmin || (user.Id == postUser.Id && user.IsAdmin == postUser.IsAdmin)) {
			http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
			return
		}

		globalDbLock.RLock()
		var ok bool
		newUser, ok = globalDb.Users[postUser.Id]
		globalDbLock.RUnlock()

		if !ok {
			http.Error(w, "400 Bad Request (user does not exist)", http.StatusBadRequest)
			return
		}

		newUser.Username = postUser.Username
		newUser.IsAdmin = postUser.IsAdmin
		if postUser.Password != "" {
			newUser.Password = hashedPassword
		}
	}

	globalDbLock.Lock()
	globalDb.Users[newUser.Id] = newUser
	err = persistDatabase()
	globalDbLock.Unlock()
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not persist database)", http.StatusInternalServerError)
		return
	}

	writeJsonResponse(w, map[string]string{
		"status": "success",
	})
}
