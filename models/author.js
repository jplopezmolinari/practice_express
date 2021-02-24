var Sequelize = require('sequelize');

var db = require('./_db');

var Author = db.define('author', {
  firstName: Sequelize.STRING,
  lastName: Sequelize.STRING
}, {
  timestamps: false
});

module.exports = Author;