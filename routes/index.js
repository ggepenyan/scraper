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
			next()
		}
		return models.Ogs.findOne({
			where: {
				link: url
			}
		}).then(ogDatas => {
			if (ogDatas == null) {
				var options = {
					uri: url,
					transform: function (body) {
						return cheerio.load(body);
					}
				}
				metaOgs = []
				
				sendRequestShowResult(options, url, res)
			} else {
				showDatas(ogDatas, res)
			}
		}).catch(error => {
			next(error)
		})
	} else {
		next()
	}
})
function sendRequestShowResult(options, url, res) {
	return request(options).then(function ($) {
		for (var i = $('head meta[property^=og]').length - 1; i >= 0; i--) {
			var elem = i + ''

			var metaAttribs = $('head meta[property^=og]')[elem].attribs

			metaOgs.push([metaAttribs.property, metaAttribs.content])
		}
		ogDatas = {}
		ogDatasAdd(metaOgs)

		download(ogDatas.image, './public/images/image.jpg', function(){
			var image = sizeOf('./public/images/image.jpg')
			ogDatas.imageWidth = image.width
			ogDatas.imageHeight = image.height
		})
		
		if (ogDatas.type == 'video' && ogDatas.name == 'YouTube'){
			id = $('body meta[itemprop^=videoId]')['0'].attribs.content
			
			youTube.setKey('AIzaSyB1OOSpTREs85WUMvIgJvLTZKye4BVsoFU')
			
			k = findVideoInsertDb(id, res)
		} 
		else {
			createDatasDb(ogDatas, res)
		}
	})
}
function download(uri, fileName, callback){
	return request.head(uri).then(result => {
		return request(uri).pipe(fs.createWriteStream(fileName)).on('close', callback)
	})
}
function findVideoInsertDb(id, res) {
	return new Promise(function(resolve, reject) {
		youTube.getById(id, function(error, result) {
			if (error) {
				return reject(error)
			}
			else {
				var statistics = result.items[0]['statistics']
				ogDatas.viewCount = statistics.viewCount
				ogDatas.dislikeCount = statistics.dislikeCount
				ogDatas.likeCount = statistics.favoriteCount
				ogDatas.commentCount = statistics.commentCount
				ogDatas.publishedAt = result.items[0]['snippet']['publishedAt']
				
				resolve(ogDatas)
			}
		})
	}).then(datasObj => {
		return models.Ogs.findOne({
			where: {
				url: datasObj.url
			}
		}).then(datasOg => {
			if (datasOg == null) {
				createDatasDb(datasObj, res)
			} else {
				showDatas(datasOg, res)
			}
		})
	})
}
function ogDatasAdd(metaOgs) {
	metaOgs.map(function (elem) {
		var url = elem[0].search('url')
		if (url !== -1){
			ogDatas.url = elem[1]
		}

		var image = elem[0].search('image')
		if (image !== -1){
			ogDatas.image = elem[1]
		}

		var type = elem[0].search('type')
		if (type !== -1){
			ogDatas.type = elem[1]
		}

		var title = elem[0].search('title')
		if (title !== -1){
			ogDatas.title = elem[1]
		}

		var descr = elem[0].search('description')
		if (descr !== -1){
			ogDatas.descr = elem[1]
		}

		var name = elem[0].search('site_name')
		if (name !== -1){
			ogDatas.name = elem[1]
		}
	})
}
function createDatasDb(ogs, res) {
	return models.Ogs.findOne({
		where: {
			url: ogs.url
		}
	}).then(datasOg => {
		if (datasOg == null) {
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
				'publishedAt': ogs.publishedAt || null
			}).then(og => {
				showDatas(og, res)
			})
		} else {
			showDatas(datasOg, res)
		}
	})
}
function showDatas(ogDatas, res) {
	if (ogDatas.type == 'video' && ogDatas.siteName == 'YouTube'){
		res.json({
			link: ogDatas.url,
			title: ogDatas.title,
			description: ogDatas.description,
			siteName: ogDatas.siteName,
			type: ogDatas.type,
			image: ogDatas.image,
			imageHeight: ogDatas.imageHeight,
			imageWidth: ogDatas.imageWidth,
			viewCount: ogDatas.viewCount,
			likeCount: ogDatas.likeCount,
			dislikeCount: ogDatas.dislikeCount,
			commentCount: ogDatas.commentCount,
			publishedAt: ogDatas.publishedAt,
		})
	} else {
		res.json({
			link: ogDatas.url,
			title: ogDatas.title,
			description: ogDatas.description,
			siteName: ogDatas.siteName,
			type: ogDatas.type,
			image: ogDatas.image,
			imageHeight: ogDatas.imageHeight,
			imageWidth: ogDatas.imageWidth
		})
	}
}

module.exports = router