# Mendel's Accountant Web UI

This is the user interface for the [Mendel's Accountant genetic mutation tracking program](https://github.com/genetic-algorithms/mendel-go).

# Initialize Development Environment

If this is the first time developing for this project, install all of the needed tools:

* Install `npm`. For example, on macOS:

  ```bash
  brew install npm
  ````

* Install all of the javascript packages needed by this project (listed in `package.json`):

  ```bash
  npm install
  ````

## Develop

After modifying code, compile the go code (the server portion) and start it:

```bash
make runserver
```

Then bundle the typescript code and start the front end:

```bash
scripts/watch
```

That last command creates `static/js/bundle.js`, which for now should be committed to git. It will also watch the source files and automatically regenerate `static/js/bundle.js` when necessary.

## Test the Backend API

The backend API can be tested directly by using a URL like this in the browser or curl:

```bash
http://localhost:3000/api/job-plot-files/?jobId=b7f00ecc
```

## Build, Install, and Run the Package

First, set the `VERSION` and `RELEASE` variables in `Makefile`.

### For Linux RPM:

Note: so far the RPM has only been tested on Amazon Linux.

- Increment the `VERSION` value in `Makefile`
- Build (you build the linux rpm on mac if you 1st: `brew install rpm`):

```bash
make rpmbuild
```

- The rpm is created in `~/rpmbuild/RPMS/x86_64/`
- Install:

```bash
yum install mendel-web-ui-*.x86_64.rpm
```

- The server is started automatically by `systemctl` running `/etc/init/mendel-web-ui.conf`.
- Browse http://hostname-or-ip:8581/
- If you just installed the rpm for the 1st time, the `admin` password is `changeme!` . Once logged in, change the `admin` password by clicking on `USERS` and then the `admin` user, and set the password to something you will remember. Create additional users as necessary.

### For the Mac install package:

- Increment the `VERSION` value in `Makefile`
- Build:

```bash
make macpkg
```

- The mac pkg is created in `pkg/mac/build/`
- Install:

```bash
make macinstall
```

- Put `/usr/local/bin` in your path, if you haven't already.
- Start the web UI server:

```bash
start-mendel-ui.sh
```

- Browse http://0.0.0.0:8581/
- If you just installed the package for the 1st time, the `admin` password is `changeme!` . Once logged in, change the `admin` password by clicking on `USERS` and then the `admin` user, and set the password to something you will remember. Create additional users as necessary.

To stop the web UI server:

```bash
stop-mendel-ui.sh
```

## Create a Github Release for This New Version

- Go to https://github.com/genetic-algorithms/mendel-web-ui/releases and click `Draft a new release`
- Set the `tag` to this version number, enter a `title` and `description`
- Upload the rpm for this version that was created in `~/rpmbuild/RPMS/x86_64/`
- Upload the mac pkg for this version that was created in `pkg/mac/build/`
- Click `Publish release`

## To Update All of the Npm Packages for the Project

- Update your global packages (if you have any):

```bash
npm outdated --depth 0 -g
# for each outdated package:
npm -g install <pkg>
npm outdated --depth 0 -g   # verify nothing is out of date
```

- Update your local/project packages. Note: these packages are just used when running locally in development and for the typescript types. In production runtime, the packages are downloaded from unpkg.com (see below).

```bash
npm outdated --depth 0   # to see how many top-level pkgs will be updated
npm update   # will update all outdated pkgs, but only within major version
# for each pkg that you want to go to the next major version:
npm install <pkg>@latest
npm list --depth 0   # to see the new versions of your top-level pkgs (needed in next step)
npm list <pkg>   # see the version of this installed pkg
# if some pkgs specified in package.json are missing, you need to: npm install <pkg>
npm audit   # check for vulnerable pkgs
```

- If you need to revert updates that broke something, revert `package-lock.json` and then run: `npm audit`

- Edit `cmd/server/base_template.go` to pull the same package versions during production runtime from [unpkg.com](https://unpkg.com/).
  - The exception to that is the `@types/` pkgs in `package.json`. Those pkg versions tend to diverge from the actual corresponding js version.
  - To find the versions available for all pkgs in unpkg include `<pkg>/` in the url, e.g. [https://unpkg.com/react/](https://unpkg.com/react/). (The trailing `/` is important.)
  - The pkg fsevents is not currently available in unpkg, so should not be included in `cmd/server/base_template.go` (not sure why).
