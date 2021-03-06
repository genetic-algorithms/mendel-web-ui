#!/bin/bash

# Start the mendel web ui for either production (installed by the mac pkg), or for development.
# Note: this is currently not used to start mendel ui on linux. mendel-web-ui.conf is used for that because it needs to be slightly different.
# This is structured such that for prod no args are needed, so that it can be run by double-clicking on it on mac.

runEnv=${1:-prod}

if [[ "$runEnv" == "prod" ]]; then
	port=8581
	logDir="/var/log/mendel-web-ui"
	staticDir="/usr/local/mendel-web-ui/static"
	cd /usr/local/var/run/mendel-web-ui    # this gives it access to the dirs: database, output
	# we also specify in the mendel-go config file that the job output should be put in output/jobs
	/usr/local/bin/mendel-web-ui $port /usr/local/bin/mendel-go /usr/local/share/mendel-go/mendel-defaults.ini $staticDir > $logDir/stdout.log 2> $logDir/stderr.log &
	if [[ $? -eq 0 ]]; then
		echo "/usr/local/bin/mendel-web-ui started, browse http://0.0.0.0:$port/"
	fi
elif [[ "$runEnv" == "dev" ]]; then
	# We assume they run this in the mendel-web-ui github dir
	staticDir="${2:-}"  # to override using the local static dir
	port=8581
	# we also specify in the mendel-go config file that the job output should be put in output/jobs
	cmd/server/mendel-web-ui $port ../mendel-go/mendel-go ../mendel-go/mendel-defaults.ini $staticDir &  # stdout and stderr will go to the terminal session
	if [[ $? -eq 0 ]]; then
		echo "cmd/server/mendel-web-ui started, browse http://0.0.0.0:$port/"
	fi

else
	echo "Usage: $0 [dev|prod]"
	exit 1
fi
