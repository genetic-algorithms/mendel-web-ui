package main

import (
	"encoding/json"
	"net/http"
)

func apiCreateEditUserHandler(w http.ResponseWriter, r *http.Request) {
	user := getAuthenticatedUser(r)
	if user.Id == "" || !user.IsAdmin {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	if !isValidPostJson(r) {
		http.Error(w, "400 Bad Request (method or content-type)", http.StatusBadRequest)
		return
	}

	decoder := json.NewDecoder(r.Body)
	var newUser DatabaseUser
	err := decoder.Decode(&newUser)
	if err != nil {
		http.Error(w, "400 Bad Request (parsing body)", http.StatusBadRequest)
		return
	}

	usernameExists := false
	globalDbLock.RLock()
	for _, u := range globalDb.Users {
		if u.Username == newUser.Username {
			usernameExists = true
			break
		}
	}
	globalDbLock.RUnlock()

	if usernameExists {
		writeJsonResponse(w, map[string]string{
			"error": "username_exists",
		})
		return
	}

	userId, err := generateUuid()
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not generate userId)", http.StatusInternalServerError)
		return
	}

	newUser.Id = userId

	globalDbLock.Lock()
	globalDb.Users[newUser.Id] = newUser
	err = persistDatabase()
	globalDbLock.Unlock()
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not persist database)", http.StatusInternalServerError)
		return
	}

	writeJsonResponse(w, map[string]string{})
}
