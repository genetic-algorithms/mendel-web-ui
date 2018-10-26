package main

import (
	"net/http"
)

func apiLogoutHandler(w http.ResponseWriter, r *http.Request) {
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	if !isValidPostJson(r) {
		http.Error(w, "400 Bad Request (method or content-type)", http.StatusBadRequest)
		return
	}

	session := map[string]string{}

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

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte("{}"))
}
