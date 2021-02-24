var models = require('./models'),
    Author = models.Author,
    Book = models.Book,
    Chapter = models.Chapter,
    db = models.db;
var Promise = require('bluebird');
var chance = new require('chance')(123);
var _ = require('lodash');

var numAuthors = 20;
var numChapters = 400;
var chaptersPerBook = 10;
var numBooks = Math.ceil(numChapters / chaptersPerBook);

var pattern = /\s\w/g;
function randTitle () {
  return chance.sentence({
    words: chance.natural({min: 1, max: 6})
  }).slice(0, -1).replace(pattern, function (match) {
    return match.toUpperCase();
  });
}

function randAuthor () {
  return {
    firstName: chance.first(),
    lastName: chance.last()
  };
}

function randChapter () {
  return {
    title: randTitle(),
    text: chance.paragraph({
      sentences: chance.natural({min: 50, max: 200})
    })
  };
}

function randBook () {
  return {
    title: randTitle()
  };
}

console.log('---seeding---');

console.log('-generating authors-');
var authors = _.times(numAuthors, randAuthor)
.map(function (datum) {
  return Author.build(datum);
});
console.log('-done generating authors-');

console.log('-generating chapters-');
var chapters = _.times(numChapters, randChapter)
.map(function (datum) {
  return Chapter.build(datum);
});
console.log('-done generating chapters-');

console.log('-generating books-');
var books = _.times(numBooks, randBook)
.map(function (datum) {
  return Book.build(datum);
});
console.log('-done generating books-');

function saveInstance (instance) {
  return instance.save();
}

var savedAuthors, savedChapters;
console.log('-clearing-');
db.sync({force: true})
.then(function () {
  console.log('-done clearing-');
  console.log('-saving authors-');
  return Promise.map(authors, saveInstance);
})
.then(function (_savedAuthors) {
  savedAuthors = _savedAuthors;
  console.log('-done saving authors-');
  console.log('-saving chapters-');
  return Promise.map(chapters, saveInstance);
})
.then(function (_savedChapters) {
  savedChapters = _savedChapters;
  console.log('-done saving chapters-');
  console.log('-saving books-');
  return Promise.map(books, saveInstance);
})
.then(function (savedBooks) {
  console.log('-done saving books-');
  console.log('-associating author and chapters-');
  return Promise.map(books, function (book, n) {
    var chaps = savedChapters.slice(n*chaptersPerBook, (n+1)*chaptersPerBook);
    chaps.forEach(function (chapter, idx) {
      chapter.number = idx + 1;
    });
    return Promise.map(chaps, saveInstance)
    .then(function (theseChapters) {
      return book.setChapters(theseChapters);
    })
    .then(function () {
      var auth = chance.pick(savedAuthors);
      return book.setAuthor(auth);
    });
  });
})
.then(function () {
  console.log('-done associating author and chapters-');
  console.log('---done seeding---');
})
.catch(function (err) {
  console.error('Seeding error', err.message, err.stack);
})
.then(function () {
  process.exit();
});
