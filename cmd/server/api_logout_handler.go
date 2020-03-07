package main

import (
	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/mutils"
	"net/http"
)

// Called for /api/logout/ route
func apiLogoutHandler(w http.ResponseWriter, r *http.Request) {
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	if !mutils.IsValidPostJson(r) {
		http.Error(w, "400 Bad Request (method or content-type)", http.StatusBadRequest)
		return
	}
	mutils.Verbose("/api/logout/ user.Id=%s", user.Id)

	session := map[string]string{}

	encoded, err := globalSecureCookie.Encode("session", session)
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not encode session cookie)", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    encoded,
		Path:     "/",
		HttpOnly: true,
	})

	w.Header().Set("Content-Type", "application/json")
	_, err = w.Write([]byte("{}"))
	if err != nil {
		http.Error(w, "500 Internal Server Error (could not write response)", http.StatusInternalServerError)
		return
	}
}
