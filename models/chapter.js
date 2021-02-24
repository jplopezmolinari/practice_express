var Promise = require('bluebird');
var Sequelize = require('sequelize');

var db = require('./_db');

var Chapter = db.define('chapter', {
  title: Sequelize.STRING,
  number: Sequelize.INTEGER,
  text: Sequelize.TEXT
}, {
  timestamps: false
});

module.exports = Chapter