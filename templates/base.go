package templates

var Base = `
	<!DOCTYPE html>
	<html lang="en">
		<head>
			<title>Mendel's Accountant</title>
			<meta name="viewport" content="initial-scale=1.0" />

			<link href="https://fonts.googleapis.com/css?family=Roboto:400,500" rel="stylesheet" />

			<link href="/static/css/main.css" rel="stylesheet" />
			<link href="/static/css/button.css" rel="stylesheet" />
			<link href="/static/css/header.css" rel="stylesheet" />
			<link href="/static/css/login.css" rel="stylesheet" />
			<link href="/static/css/new_job.css" rel="stylesheet" />
		</head>
		<body>
			<div id="react-root"></div>

			<script src="/static/vendor/react/umd/react.development.js"></script>
			<script src="/static/vendor/react-dom/umd/react-dom.development.js"></script>
			<script src="/static/vendor/redux/dist/redux.min.js"></script>
			<script src="/static/vendor/react-redux/dist/react-redux.min.js"></script>
			<script src="/static/vendor/immer/dist/immer.umd.js"></script>

			<script src="/static/js/bundle.js"></script>
		</body>
	</html>
`
