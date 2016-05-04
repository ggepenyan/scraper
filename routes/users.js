var express = require('express'),
	router = express.Router(),
	models = require('../models/');

/* GET users listing. */
router.get('/', function(req, res, next) {

	res.send("hello")
})

module.exports = router;
