#!/bin/bash

# Stop the mendel web ui.
# Not using killall, so we do not require it to be installed.

# Find the pid of the ui to kill
pid=$(ps aux|grep mendel-web-ui|grep -v grep|grep -v 'stop-mendel-ui'|awk '{print $2}')

if [[ $? -ne 0 ]]; then
	echo "error finding mendel-web-ui process id"  # stderr should have already displayed
	exit 3
elif [[ -z "$pid" ]]; then
	echo "mendel-web-ui process not found"
	exit 1
elif [[ "$pid" =~ " " ]]; then
	# got multiple words instead of 1 pid
	echo "found more than 1 process id for mendel-web-ui: $pid"
	exit 2
fi

#echo kill $pid
kill $pid

if [[ $? -eq 0 ]]; then
	echo "mendel-web-ui stopped"
fi
