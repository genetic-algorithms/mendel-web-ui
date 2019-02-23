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

## Build the Packages

First, set the VERSION variable in `Makefile`.

Build the RPM:
```
make rpmbuild
```

Note: so far the RPM has only been tested on Amazon Linux.

Build the Mac install package:
```
make macpkg
```

## Run From the Package

On Amazon Linux:

The server is started automatically by `initctl` running `/etc/init/mendel-web-ui.conf`.

Browse http://hostname-or-ip:8581/

On Mac:

Put `/usr/local/bin` in your path, if you haven't already.

To start the web UI server:

```
start-mendel-ui.sh
```

To stop the web UI server:

```
stop-mendel-ui.sh
```
