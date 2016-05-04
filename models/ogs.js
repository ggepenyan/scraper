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
		imagewidth:{
			type: DataTypes.STRING
		},
		imageheight:{
			type: DataTypes.STRING
		},
		sitename:{
			type: DataTypes.STRING
		},
		type:{
			type: DataTypes.STRING
		},
		url:{
			type: DataTypes.STRING
		},
		link:{
			type: DataTypes.STRING
		}
	})
	
	sequelize.sync()

	return Ogs
}