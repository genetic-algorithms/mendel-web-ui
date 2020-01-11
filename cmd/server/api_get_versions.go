package main

import (
	"github.com/genetic-algorithms/mendel-web-ui/cmd/server/mutils"
	"log"
	"net/http"
	"os/exec"
)

// Called for /api/get-versions/ route
func apiGetVersionsHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("In /api/get-versions/ ...")
	user := getAuthenticatedUser(r)
	if user.Id == "" {
		http.Error(w, "401 Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get mendel-go version, but running the cmd
	out, err := exec.Command(globalMendelGoBinaryPath, "-V").Output()
	if err != nil {
		http.Error(w, "500 error running "+globalMendelGoBinaryPath+": "+err.Error(), http.StatusInternalServerError)
		return
	}

	goVerson := string(out)

	mutils.WriteJsonResponse(w, map[string]interface{}{
		"mendelUiVersion": MENDEL_UI_VERSION,
		"mendelGoVersion": goVerson,
	})
}
