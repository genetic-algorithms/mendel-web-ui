# Mendel's Accountant Web UI

This is the user interface for the [Mendel's Accountant genetic mutation tracking program](https://github.com/genetic-algorithms/mendel-go).

## Develop

After modifying code, compile the go code (the server portion) and start it:
```
make runserver
```

Then bundle the typescript code and start the front end:
```
scripts/watch
```

That last command creates `static/js/bundle.js`, which for now should be committed to git. It will also watch the source files and automatically regenerate `static/js/bundle.js` when necessary.

## Test the Backend API

The backend API can be tested via browser or curl URLs like this:
```
http://0.0.0.0:8581/api/job-plot-files/?jobId=b7f00ecc
```

## Build, Install, and Run the Package

First, set the `VERSION` and `RELEASE` variables in `Makefile`.

### For Linux RPM:

Note: so far the RPM has only been tested on Amazon Linux.

- Increment the `VERSION` value in `Makefile`
- Build (you build the linux rpm on mac if you 1st: `brew install rpm`):
```
make rpmbuild
```
- The rpm is created in `~/rpmbuild/RPMS/x86_64/`
- Install:
```
yum install mendel-web-ui-*.x86_64.rpm
```
- The server is started automatically by `systemctl` running `/etc/init/mendel-web-ui.conf`.
- Browse http://hostname-or-ip:8581/
- If you just installed the rpm for the 1st time, the `admin` password is `changeme!` . Once logged in, change the `admin` password by clicking on `USERS` and then the `admin` user, and set the password to something you will remember. Create additional users as necessary.

### For the Mac install package:

- Increment the `VERSION` value in `Makefile`
- Build:
```
make macpkg
```
- The mac pkg is created in `pkg/mac/build/`
- Install:
```
make macinstall
```
- Put `/usr/local/bin` in your path, if you haven't already.
- Start the web UI server:
```
start-mendel-ui.sh
```
- Browse http://hostname-or-ip:8581/
- If you just installed the package for the 1st time, the `admin` password is `changeme!` . Once logged in, change the `admin` password by clicking on `USERS` and then the `admin` user, and set the password to something you will remember. Create additional users as necessary.

To stop the web UI server:
```
stop-mendel-ui.sh
```

## Create a Github Release for This New Version

- Go to https://github.com/genetic-algorithms/mendel-web-ui/releases and click `Draft a new release`
- Set the `tag` to this version number, enter a `title` and `description`
- Upload the zipped rpm for this version that was created in `~/rpmbuild/RPMS/x86_64/`
- Upload the zipped mac pkg for this version that was created in `pkg/mac/build/`
- Click `Publish release`
