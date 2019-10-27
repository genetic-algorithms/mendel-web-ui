#!/bin/bash

# Changes the pw of the specified user (and restarts the mendel web ui in the process).

if [[ -z "$2" ]]; then
	echo "Usage: $(basename $0) <username> <pw>"
	exit
fi

username="$1"
pw="$2"

myDir=$(dirname $0)
dbFile=/usr/local/var/run/mendel-web-ui/database/database.json
#tempDbFile=/tmp/mendel-web-ui-database.json

isMacos() {
	if [[ "$(uname -s)" == "Darwin" ]]; then
		return 0
	else
		return 1
	fi
}

confirmCmds() {
    for c in $*; do
        if ! which $c >/dev/null 2>&1; then
            echo "Error: $c is not installed but required, exiting"
            exit 2
        fi
    done
}

stopWebSvr() {
	if isMacos; then
		if [[ -f "$myDir/../scripts/stop-mendel-ui.sh" ]]; then
			$myDir/../scripts/stop-mendel-ui.sh   # this is the dev version of the script
		else
			$myDir/stop-mendel-ui.sh
		fi
	else
		if which systemctl >/dev/null; then
			sudo systemctl stop mendel-web-ui
		else
			sudo initctl stop mendel-web-ui
		fi
	fi
}

startWebSvr() {
	if isMacos; then
		if [[ -f "$myDir/../scripts/start-mendel-ui.sh" ]]; then
			$myDir/../scripts/start-mendel-ui.sh   # this is the dev version of the script
		else
			$myDir/start-mendel-ui.sh
		fi
	else
		if which systemctl >/dev/null; then
			sudo systemctl start mendel-web-ui
		else
			sudo initctl start mendel-web-ui
		fi
	fi
}

#confirmCmds jq base64 htpasswd
confirmCmds jq

set -e  # stop if any cmd fails
stopWebSvr || true   # keep going

#userid=$(jq ".users[] | select(.username==\"$username\").id" $dbFile)  # get the id of this user
#hashedPw=$(htpasswd -bnBC 10 "" $pw | tr -d ':\n')  # mendel web ui expects the pw to be bcrypted and base64 encoded
#encodedPw=$(echo "$hashedPw" | base64)
#jq ".users[$userid].password=\"$encodedPw\" " $dbFile > $tempDbFile  # put the pw in the db
#mv $tempDbFile $dbFile

MENDEL_DB_FILE=$dbFile $myDir/mendel-chg-pw "$username" "$pw"

startWebSvr
set +e
