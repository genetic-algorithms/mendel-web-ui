package main

/*
The html for the SPA (single page app). This is the only html sent from the svr to the browser.
All of the javascript components are not ours are loaded from unpkg.
This html is parsed with the context provided in main.rootHandler(), which replaces the {{}} sections.
*/
var baseTemplate = `
	<!DOCTYPE html>
	<html lang="en">
		<head>
			<title>Mendel's Accountant</title>
			<meta name="viewport" content="initial-scale=1.0" />

			<link href="https://fonts.googleapis.com/css?family=Roboto:400,500,700" rel="stylesheet" />

			{{range .CssFiles}}
				<link href="{{.}}" rel="stylesheet" />
			{{end}}
		</head>
		<body>
			<div id="react-root"></div>

			<script src="https://unpkg.com/react@16.9.0/umd/react.production.min.js"></script>
			<script src="https://unpkg.com/react-dom@16.9.0/umd/react-dom.production.min.js"></script>
			<script src="https://unpkg.com/redux@4.0.5/dist/redux.min.js"></script>
			<script src="https://unpkg.com/react-redux@7.1.3/dist/react-redux.min.js"></script>
			<script src="https://unpkg.com/immer@6.0.2/dist/immer.umd.production.min.js"></script>
			<script src="https://unpkg.com/plotly.js@1.50.1/dist/plotly-basic.min.js"></script>
			<script src="https://unpkg.com/moment@2.24.0/min/moment.min.js"></script>
			<script src="https://unpkg.com/toml-j0.4@1.1.1/dist/toml-browser.js"></script>

			{{range .JsFiles}}
				<script src="{{.}}"></script>
			{{end}}
		</body>
	</html>
`
