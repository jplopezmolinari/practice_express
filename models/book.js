var Promise = require('bluebird');
var Sequelize = require('sequelize');

var db = require('./_db');

var Book = db.define('book', {
  title: Sequelize.STRING
}, {
  timestamps: false
});

module.exports = Book;