#!/bin/bash

# Copy the files that should be packaged into the mac .pkg file.
# It is assumed this script will be run in the top dir of the mendel-web-ui repo, and the mendel-web-ui binary has already been built.

BUILD_ROOT="$1"
if [[ ! -d "$BUILD_ROOT" ]]; then
	echo "Usage: $0 <root-dir>"
	exit 1
fi

mkdir -p $BUILD_ROOT/bin $BUILD_ROOT/share/mendel-web-ui $BUILD_ROOT/mendel-web-ui/database $BUILD_ROOT/mendel-web-ui/output
#todo: remove this after adding database and output flags to mendel-web-ui
chmod 777 $BUILD_ROOT/mendel-web-ui/database $BUILD_ROOT/mendel-web-ui/output
cp cmd/server/mendel-web-ui scripts/start-mendel-ui.sh scripts/stop-mendel-ui.sh $BUILD_ROOT/bin
cp LICENSE COPYRIGHT $BUILD_ROOT/share/mendel-web-ui
cp -a static rollup.config.js *.json $BUILD_ROOT/mendel-web-ui
