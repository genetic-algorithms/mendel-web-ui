#!/bin/bash

# Stop the mendel web ui.
# Not using killall, so we do not require it to be installed.

pid=$(ps aux|grep mendel-web-ui|grep -v grep|grep -v 'stop-mendel-ui'|awk '{print $2}')

if [[ -z "$pid" ]]; then
	echo "mendel-web-ui process not found"
	exit 1
fi

#echo kill $pid
kill $pid

if [[ $? -eq 0 ]]; then
	echo "mendel-web-ui stopped"
fi
