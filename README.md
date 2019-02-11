# Build

Compile the go code:
```
./scripts/build_go
```

Bundle to typescript code while you are developing:
```
watch
```

That last command creates `static/js/bundle.js`, which for now should be committed to git.

# Run

To start the web UI server:

```
scripts start-mendel-ui.sh {dev|prod}
```

To stop the web UI server:

```
scripts stop-mendel-ui.sh
```

Or if you want to start it manually:

```
./cmd/server/mendel-web-ui <port> <binary> <default_config>
```

Example:

```
./cmd/server/mendel-web-ui 8590 ../mendel-go/mendel-go ../mendel-go/mendel-defaults.ini
```
