package main

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

			<script src="https://unpkg.com/react@16.4.2/umd/react.development.js"></script>
			<script src="https://unpkg.com/react-dom@16.4.2/umd/react-dom.development.js"></script>
			<script src="https://unpkg.com/redux@4.0.0/dist/redux.min.js"></script>
			<script src="https://unpkg.com/react-redux@5.0.7/dist/react-redux.min.js"></script>
			<script src="https://unpkg.com/immer@1.5.0/dist/immer.umd.js"></script>
			<script src="https://unpkg.com/plotly.js@1.40.1/dist/plotly-basic.min.js"></script>
			<script src="https://unpkg.com/moment@2.22.2/min/moment.min.js"></script>

			{{range .JsFiles}}
				<script src="{{.}}"></script>
			{{end}}
		</body>
	</html>
`
