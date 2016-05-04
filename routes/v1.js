var express = require('express'),
	router = express.Router(),
	app = module.exports = express();


app.use('/', require('./index'))
app.use('/users', require('./users'))
