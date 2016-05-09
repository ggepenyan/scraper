module.exports = function(sequelize, DataTypes) {
	var Ogs = sequelize.define('Ogs',{
		title:{
			type: DataTypes.STRING
		},
		description:{
			type: DataTypes.STRING
		},
		image:{
			type: DataTypes.STRING
		},
		imageWidth:{
			type: DataTypes.STRING
		},
		imageHeight:{
			type: DataTypes.STRING
		},
		siteName:{
			type: DataTypes.STRING
		},
		type:{
			type: DataTypes.STRING
		},
		viewCount:{
			type: DataTypes.STRING
		},
		likeCount:{
			type: DataTypes.STRING
		},
		dislikeCount:{
			type: DataTypes.STRING
		},
		commentCount:{
			type: DataTypes.STRING
		},
		publishedAt:{
			type: DataTypes.STRING
		},
		url:{
			type: DataTypes.STRING
		}
	})
	
	sequelize.sync()

	return Ogs
}