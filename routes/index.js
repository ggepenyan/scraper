var express = require('express'),
	router = express.Router(),
	models = require('../models'),

	fs = require('fs'),
	path = require('path'),

	Entities = require('html-entities').AllHtmlEntities,
	
	entities = new Entities(),

	Promise = require("bluebird"),
	
	request = require('request-promise'),
	cheerio = require('cheerio'),
	sizeOf = require('image-size');
/* GET home page.*/
var YouTube = require('youtube-node');

var youTube = new YouTube();

router.get('/scrape', function (req, res, next) {

// youTube.setKey('AIzaSyAV_bBoijsUtUsa_fEKTM8OaBZsxCOwM1o');

// youTube.search('World War Trailer', 2, function(error, result) {
//   if (error) {
//     console.log(error);
//   }
//   else {
//     console.log(JSON.stringify(result, null, 2));
//   }
// });
	if (req.query.q) {
		var url = req.query.q
		var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
		var link = url.replace(exp,"<a href=\"$1\" target=\"_blank\">visit page</a>")
		var str = link.search('<a href')
		if (str == -1) {
			return
		}
		console.log(url)
		return models.Ogs.findOne({
			where: {
				link: url
			}
		}).then(ogdates => {
			if (ogdates == null) {
				var options = {
					uri: url,
					transform: function (body) {
						return cheerio.load(body);
					}
				}
				request(options).then(function ($) {

					meta_og = []

					for (var i = $('head meta[property^=og]').length - 1; i >= 0; i--) {
						var elem = i + ''

						var meta_attribs = $('head meta[property^=og]')[elem].attribs

						meta_og.push([meta_attribs.property, meta_attribs.content])
					}
					og_dates = {}
					meta_og.map(function (elem) {
						var url = elem[0].search('url')
						if (url !== -1)
							og_dates.url = elem[1]
						
						var image = elem[0].search('image')
						if (image !== -1)
							og_dates.image = elem[1]

						var type = elem[0].search('type')
						if (type !== -1)
							og_dates.type = elem[1]

						var title = elem[0].search('title')
						if (title !== -1)
							og_dates.title = elem[1]

						var descr = elem[0].search('description')
						if (descr !== -1)
							og_dates.descr = elem[1]

						var name = elem[0].search('site_name')
						if (name !== -1)
							og_dates.name = elem[1]
					})
					console.log(og_dates.image)
					var download = function(uri, filename, callback){
						request.head(uri, function(err, res, body){
							console.log('content-type:', res.headers['content-type'])
							console.log('content-length:', res.headers['content-length'])

							request(uri).pipe(fs.createWriteStream(filename)).on('close', callback)
						})
					}

					download(og_dates.image, './public/images/image.jpg', function(){
						console.log('done')
					})
					var image = sizeOf('./public/images/image.jpg')
					og_dates.image_width = image.width
					og_dates.image_height = image.height
					return models.Ogs.create({
						'url': og_dates.url || null,
						'title': og_dates.title || null,
						'description': og_dates.descr || null,
						'sitename': og_dates.name || null,
						'type': og_dates.type || null,
						'image': og_dates.image || null,
						'imageheight': og_dates.image_width || null,
						'imagewidth': og_dates.image_height || null,
						'link': url
					}).then(og => {
						res.json({
							link: og.url,
							title: og.title,
							description: og.description,
							type: og.type,
							image: og.image,
							imagewidth: og.imagewidth,
							imageheight: og.imageheight,
							sitename: og.sitename
						})
					})
				})
			} else {
				res.json({
					link: ogdates.url,
					title: ogdates.title,
					description: ogdates.description,
					type: ogdates.type,
					image: ogdates.image,
					imagewidth: ogdates.imagewidth,
					imageheight: ogdates.imageheight,
					sitename: ogdates.sitename
				})
			}
		}).catch(function (error) {
			next(error)
		})
		}
	res.send('index')
})

// router.post('/scrape', function (req, res, next) {
// 	if (!req.body.cont || req.body.cont == '') {
// 		return res.redirect('/scrape')
// 	}
// 	var url = req.body.cont
// 	var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig
// 	url = url.replace(exp,"<a href=\"$1\" target=\"_blank\">visit page</a>")
// 	var str = url.search('<a href')
// 	if (str == -1) {
// 		return
// 	}
// 	return models.Ogs.findOne({
// 		where: {
// 			link: req.body.cont
// 		}
// 	}).then(ogdates => {
// 		if (ogdates == null) {
// 			var options = {
// 				uri: req.body.cont,
// 				transform: function (body) {
// 					return cheerio.load(body);
// 				}
// 			}
// 			request(options).then(function ($) {

// 				meta_og = []

// 				for (var i = $('head meta[property^=og]').length - 1; i >= 0; i--) {
// 					var elem = i + ''

// 					var meta_attribs = $('head meta[property^=og]')[elem].attribs

// 					meta_og.push([meta_attribs.property, meta_attribs.content])
// 				}
// 				res.render('index',{
// 					meta_dates: meta_og
// 				})
// 				og_dates = {}
// 				meta_og.map(function (elem) {
// 					var url = elem[0].search('url')
// 					if (url !== -1)
// 						og_dates.url = elem[1]

// 					var title = elem[0].search('title')
// 					if (title !== -1)
// 						og_dates.title = elem[1]

// 					var descr = elem[0].search('description')
// 					if (descr !== -1)
// 						og_dates.descr = elem[1]

// 					var name = elem[0].search('site_name')
// 					if (name !== -1)
// 						og_dates.name = elem[1]
// 				})
// 				return models.Ogs.create({
// 					'url': og_dates.url || null,
// 					'title': og_dates.title || null,
// 					'description': og_dates.descr || null,
// 					'sitename': og_dates.name || null,
// 					'link': req.body.cont
// 				})
// 			})
// 		} else {
// 			res.render('index',{
// 				meta_dates: ogdates,
// 				db: true
// 			})
// 		}
// 	}).catch(function (error) {
// 		next(error)
// 	})
// 	console.log(url)
// })

module.exports = router