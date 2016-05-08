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
				meta_og = []
				request(options).then(function ($) {
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
							request(uri).pipe(fs.createWriteStream(filename)).on('close', callback)
						})
					}
					download(og_dates.image, './public/images/image.jpg', function(){
						console.log('done')
					})
					var image = sizeOf('./public/images/image.jpg')
					og_dates.imageWidth = image.width
					og_dates.imageHeight = image.height
					if (og_dates.type == 'video' && og_dates.name == 'YouTube'){
						id = $('body meta[itemprop^=videoId]')['0'].attribs.content
						
						youTube.setKey('AIzaSyB1OOSpTREs85WUMvIgJvLTZKye4BVsoFU')
						function youTubeGetByIdPromise(id) {
							return new Promise(function(resolve, reject) {
								youTube.getById(id, function(error, result) {
									if (error) {
										console.log(error)
									}
									else {
										statistics = result.items[0]['statistics']
										console.log(result.items[0])
										og_dates.viewCount = statistics.viewCount
										og_dates.dislikeCount = statistics.dislikeCount
										og_dates.likeCount = statistics.favoriteCount
										og_dates.commentCount = statistics.commentCount
										og_dates.publishedAt = result.items[0]['snippet']['publishedAt']
										
										resolve(og_dates)
									}
								})
							}).then(dates => {
								create_dates_db(dates)
							})
						}
						k = youTubeGetByIdPromise(id)
						// console.log(k)
						// youTube.getById(id, function(error, result) {
						// 	if (error) {
						// 		console.log(error)
						// 	}
						// 	else {
						// 		statistics = result.items[0]['statistics']

						// 		og_dates.viewCount = statistics.viewCount
						// 		og_dates.likeCount = statistics.likeCount
						// 		og_dates.dislikeCount = statistics.dislikeCount
						// 		og_dates.favoriteCount = statistics.favoriteCount
						// 		og_dates.commentCount = statistics.commentCount
						// 		og_dates.publishedAt = result.items[0]['snippet']['publishedAt']
						// 		// console.log(JSON.stringify(result.items[0], null, 2))
						// 	}
						// })
						// console.log(og_dates)
					} else {
						create_dates_db(og_dates)
					}
				})
				console.log(meta_og)
			} else {
				show_dates(ogdates)
			}
			function create_dates_db(ogs) {
				return models.Ogs.create({
					'url': ogs.url || null,
					'title': ogs.title || null,
					'description': ogs.descr || null,
					'siteName': ogs.name || null,
					'type': ogs.type || null,
					'image': ogs.image || null,
					'imageHeight': ogs.imageWidth || null,
					'imageWidth': ogs.imageHeight || null,
					'viewCount': ogs.viewCount || null,
					'likeCount': ogs.likeCount || null,
					'dislikeCount': ogs.dislikeCount || null,
					'commentCount': ogs.commentCount || null,
					'publishedAt': ogs.publishedAt || null,
					'link': url
				}).then(og => {
					show_dates(og)
				})
			}
			function show_dates(ogdates) {
				if (ogdates.type == 'video' && ogdates.siteName == 'YouTube'){
					res.json({
						link: ogdates.url,
						title: ogdates.title,
						description: ogdates.description,
						type: ogdates.type,
						image: ogdates.image,
						imagewidth: ogdates.imagewidth,
						imageheight: ogdates.imageheight,
						sitename: ogdates.sitename,
						viewCount: ogdates.viewCount,
						likeCount: ogdates.likeCount,
						dislikeCount: ogdates.dislikeCount,
						commentCount: ogdates.commentCount,
						publishedAt: ogdates.publishedAt,
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
			}
		}).catch(function (error) {
			next(error)
		})
	}
	res.send('index')
})

module.exports = router