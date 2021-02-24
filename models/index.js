var Author = require('./author');
var Book = require('./book');
var Chapter = require('./chapter');
var db = require('./_db');

Book.belongsTo(Author);
Author.hasOne(Book);
Book.hasMany(Chapter);
Chapter.belongsTo(Book);

module.exports = {
  Author: Author,
  Book: Book,
  Chapter: Chapter,
  db: db
};