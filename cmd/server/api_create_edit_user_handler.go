package main

import (
	"encoding/json"
	"net/http"

	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/db"
	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/mutils"
	"golang.org/x/crypto/bcrypt"
)

// Called for /api/create-edit-user/ route
func apiCreateEditUserHandler(w http.ResponseWriter, r *http.Request) {
	type PostUser struct {
		Id       string `json:"id"`
		Username string `json:"username"`
		Password string `json:"password"`
		IsAdmin  bool   `json:"is_admin"`
	}

	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	if !mutils.IsValidPostJson(r) {
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
	db.Db.RLock()
	for _, u := range db.Db.Data.Users {
		if u.Username == postUser.Username && u.Id != postUser.Id {
			usernameExists = true
			break
		}
	}
	db.Db.RUnlock()

	if usernameExists {
		mutils.WriteJsonResponse(w, map[string]string{
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

	var newUser db.DatabaseUser
	if postUser.Id == "" {
		// Create user

		if !user.IsAdmin {
			http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
			return
		}

		userId, err := mutils.GenerateUuid()
		if err != nil {
			http.Error(w, "500 Internal Server Error (could not generate userId)", http.StatusInternalServerError)
			return
		}

		newUser = db.DatabaseUser{
			Id:       userId,
			Username: postUser.Username,
			Password: hashedPassword,
			IsAdmin:  postUser.IsAdmin,
		}
	} else {
		// Edit user

		if !(user.IsAdmin || (user.Id == postUser.Id && user.IsAdmin == postUser.IsAdmin)) {
			http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
			return
		}

		db.Db.RLock()
		var ok bool
		newUser, ok = db.Db.Data.Users[postUser.Id]
		db.Db.RUnlock()

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

	db.Db.Lock()
	db.Db.Data.Users[newUser.Id] = newUser
	err = db.Db.Persist()
	db.Db.Unlock()
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not persist database)", http.StatusInternalServerError)
		return
	}

	mutils.WriteJsonResponse(w, map[string]string{
		"status": "success",
	})
}
