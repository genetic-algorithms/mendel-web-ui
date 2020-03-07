SHELL ?= /bin/bash -e
#BINARY ?= cmd/server/mendel-web-ui
BINARY ?= mendel-web-ui
# Set these 2 vars before building the pkg, and set Requires in pkg/rpm/mendel-web-ui.spec if necessary
export VERSION ?= 1.1.8
# Release is only needed for the rpm, and only needs to be incremented if you have to rebuild/reinstall this version multiple times due to packaging fixes
export RELEASE ?= 1
# rpmbuild does not give us a good way to set topdir, so use the default location
RPMROOT ?= $(HOME)/rpmbuild
RPMNAME ?= mendel-web-ui
MAC_PKG_IDENTIFIER ?= com.github.genetic-algorithms.pkg.mendel-web-ui
MAC_PKG_INSTALL_DIR ?= /Users/Shared/mendel-web-ui

default: runserver

cmd/server/$(BINARY): cmd/server/*.go cmd/server/*/*.go Makefile
	echo 'package main; const MENDEL_UI_VERSION = "$(VERSION)-$(RELEASE)"' > cmd/server/version.go
	scripts/build_go

tools/mendel-chg-pw: tools/mendel-chg-pw.go cmd/server/*/*.go
	glide --quiet install
	go build -o $@ $<

runserver: cmd/server/$(BINARY) tools/mendel-chg-pw
	scripts/stop-mendel-ui.sh || true
	scripts/start-mendel-ui.sh dev

# Remember to up VERSION above. If building the rpm on mac, first: brew install rpm
# Note: during rpmbuild, get this benign msg: error: Couldn't exec /usr/local/Cellar/rpm/4.14.1_1/lib/rpm/elfdeps: No such file or directory
rpmbuild:
	mkdir -p $(RPMROOT)/{SOURCES,SRPMS,SRPMS}
	rm -f $(RPMNAME)-$(VERSION); ln -s . $(RPMNAME)-$(VERSION)  # so the tar file files can have this prefix
	rm -f $(RPMROOT)/SOURCES/$(RPMNAME)-*.tar.gz
	tar --exclude '.git*' -X .tarignore -H -czf $(RPMROOT)/SOURCES/$(RPMNAME)-$(VERSION).tar.gz $(RPMNAME)-$(VERSION)
	rm -rf $(RPMROOT)/BUILD/mendel-web-ui-*
	rm -f $(RPMROOT)/SRPMS/$(RPMNAME)*rpm $(RPMROOT)/RPMS/x86_64/$(RPMNAME)*rpm $(RPMROOT)/RPMS/x86_64/$(RPMNAME)*rpm.gz
	GOOS=linux rpmbuild --target x86_64-linux -ba pkg/rpm/$(RPMNAME).spec
	gzip --keep $(RPMROOT)/RPMS/x86_64/$(RPMNAME)-$(VERSION)-$(RELEASE).x86_64.rpm  # so we can upload it to the github release
	rm -f $(RPMNAME)-$(VERSION)   # remove the sym link

# Remember to up VERSION above.
macpkg: cmd/server/$(BINARY) tools/mendel-chg-pw
	pkg/mac/populate-pkg-files.sh pkg/mac/mendel-web-ui
	pkgbuild --root pkg/mac/$(BINARY) --scripts pkg/mac/scripts --identifier $(MAC_PKG_IDENTIFIER) --version $(VERSION) --install-location $(MAC_PKG_INSTALL_DIR) pkg/mac/build/$(BINARY)-$(VERSION).pkg
	rm -f pkg/mac/build/$(BINARY)-$(VERSION).pkg.zip
	cd pkg/mac/build; zip $(BINARY)-$(VERSION).pkg.zip $(BINARY)-$(VERSION).pkg; cd ../../..   # need to be in the same dir to zip

macinstall: macpkg
	sudo installer -pkg pkg/mac/build/$(BINARY)-$(VERSION).pkg -target '/Volumes/Macintosh HD'

macpkginfo:
	pkgutil --pkg-info $(MAC_PKG_IDENTIFIER)
	pkgutil --only-files --files $(MAC_PKG_IDENTIFIER)

upload-release:
	#TODO: create target for creating a release: https://developer.github.com/v3/repos/releases/#create-a-release

release: rpmbuild macpkg upload-release

clean:
	go clean

.PHONY: default runserver rpmbuild macpkg macinstall macpkginfo upload-release release clean
