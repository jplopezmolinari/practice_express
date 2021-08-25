var app = require('./app');
var Promise = require('bluebird');
var models = require('./models'),
    Author = models.Author,
    Book = models.Book,
    Chapter = models.Chapter,
    db = models.db;
var expect = require('chai').expect;
var supertest = require('supertest');
var agent = supertest.agent(app);
var fs = require('fs');

describe('fake library app', function () {

  function toPlainObject (instance) {
    return instance.get({plain: true});
  }

  function wasteSomeTime () {
    return new Promise(function (resolve) {
      setTimeout(resolve, 5); // tarda lo suficiente para asegurarse de que manejas cosas async apropiadamente
    });
  }

  before(function () {
    Book.addHook('beforeCreate', wasteSomeTime);
    Book.addHook('beforeUpdate', wasteSomeTime);
    Book.addHook('beforeDestroy', wasteSomeTime);
  });

  before(function () {
    Chapter.addHook('beforeCreate', wasteSomeTime);
    Chapter.addHook('beforeUpdate', wasteSomeTime);
    Chapter.addHook('beforeDestroy', wasteSomeTime);
  });

  before(function () {
    return db.sync({force: true});
  });

  afterEach(function () {
    return db.sync({force: true});
  });

  it('sirve archivos estáticos (de la carpeta static en la carpeta public) en la ruta /files', function (done) {
    agent
    .get('/files/index.html')
    .expect(200)
    .end(function (err, res) {
      if (err) return done(err);
      fs.readFile(__dirname + '/public/static/index.html', function (err, contents) {
        if (err) return done(err);
        expect(res.text).to.equal(contents.toString());
        done();
      });
    });
  });

  it('maneja errores internos del sevidor', function (done) {
    // en una verdadera aplicación, esta ruta no existiría
    // esta aquí solo para testear como disparar y manejar errores en una apliación de express
    agent
    .get('/broken')
    .expect(500, done);
  });

  it('handles custom errors', function (done) {
    // En una aplicación de verdad, esta ruta no existiría
    // esta aquí solo para testear como disparar y manejar errores una aplicación de express
    agent
    .get('/forbidden')
    .expect(403, done);
  });

  describe('/api', function () {

    describe('/books', function () {

      var author, book, chapter;

      beforeEach(function () {
        return Author.create({
          firstName: 'Testy',
          lastName: 'McTesterson'
        })
        .then(function (a) {
          author = a;
        });
      });

      beforeEach(function () {
        return Chapter.create({
          title: 'First',
          text: 'Once upon a time, the end.',
          number: 1
        })
        .then(function (c) {
          chapter = c;
        });
      });

      beforeEach(function () {
        return Book.create({
          title: 'Best Book Ever',
          authorId: author.id
        })
        .then(function (b) {
          return b.addChapter(chapter);
        })
        .then(function (b) {
          book = b;
          return Book.create({
            title: 'Worst Book Ever',
            authorId: author.id
          });
        });
      });

      it('GET todos', function (done) {
        agent
        .get('/api/books')
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          expect(res.body).to.be.instanceof(Array);
          expect(res.body).to.have.length(2);
          done();
        });
      });

      it('POST uno', function (done) {
        agent
        .post('/api/books')
        .send({
          title: 'Book Made By Test',
          authorId: author.id
        })
        .expect(201)
        .end(function (err, res) {
          if (err) return done(err);
          expect(res.body.title).to.equal('Book Made By Test');
          expect(res.body.id).to.exist;
          Book.findById(res.body.id)
          .then(function (b) {
            expect(b).to.not.be.null;
            expect(res.body).to.eql(toPlainObject(b));
            done();
          })
          .catch(done);
        });
      });

      it('GET uno', function (done) {
        agent
        .get('/api/books/' + book.id)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          expect(res.body.title).to.equal(book.title);
          done();
        });
      });

      it('GET uno que no existe', function (done) {
        agent
        .get('/api/books/12345')
        .expect(404)
        .end(done);
      });

      it('GET uno con id invalido', function (done) {
        agent
        .get('/api/books/clearlynotanid')
        .expect(500)
        .end(done);
      });

      it('PUT uno', function (done) {
        agent
        .put('/api/books/' + book.id)
        .send({
          title: 'Book Updated By Test'
        })
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          expect(res.body.title).to.equal('Book Updated By Test');
          Book.findById(book.id)
          .then(function (b) {
            expect(b).to.not.be.null;
            expect(res.body).to.eql(toPlainObject(b));
            done();
          })
          .catch(done);
        });
      });

      it('PUT uno que no existe', function (done) {
        agent
        .put('/api/books/54321')
        .send({title: 'Attempt To Update Book Title'})
        .expect(404)
        .end(done);
      });

      it('PUT usando un id invalido', function (done) {
        agent
        .put('/api/books/clearlynotanid')
        .send({title: 'Attempt To Update Book Title'})
        .expect(500)
        .end(done);
      });

      it('DELETE uno', function (done) {
        agent
        .delete('/api/books/' + book.id)
        .expect(204)
        .end(function (err, res) {
          if (err) return done(err);
          Book.findById(book.id)
          .then(function (b) {
            expect(b).to.be.null;
            done();
          })
          .catch(done);
        });
      });

      it('DELETE uno que no existe', function (done) {
        agent
        .delete('/api/books/13579')
        .expect(404)
        .end(done);
      });

      it('DELETE uno usando un id invalido', function (done) {
        agent
        .delete('/api/books/clearlynotanid')
        .expect(500)
        .end(done);
      });

      it('GET con un query string de filtro', function (done) {
        agent
        // recordá que en query strings %20 significa un caracter de espacio
        .get('/api/books?title=Best%20Book%20Ever')
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          expect(res.body).to.be.instanceof(Array);
          expect(res.body).to.have.length(1);
          done();
        });
      });

  /* ================================================================
   ----------------------------------------------------------------
     TODO DESDE ESTE PUNTO NO ES OBLIGATORIO (PERO ES RECOMENDADO)
   ----------------------------------------------------------------
   ================================================================ */


      describe('/chapters', function () {

        var addedChapter, chapterBook;

        beforeEach(function () {
          return Book.findOne({})
          .then(function (b) {
            chapterBook = b;
          });
        });

        beforeEach(function () {
          return Chapter.create({
            title: 'Added Chapter',
            number: 1,
            text: 'Once upon a time...'
          })
          .then(function (c) {
            addedChapter = c;
            return chapterBook.addChapter(c);
          });
        });

        xit('GET todos', function (done) {
          agent
          .get('/api/books/' + chapterBook.id + '/chapters')
          .expect(200)
          .end(function (err, res) {
            if (err) return done(err);
            // esto debería ser un arreglo de chapters **no libros**
            expect(res.body).to.be.instanceof(Array);
            done();
          });
        });

        xit('POST uno', function (done) {
          // Mirá la documentación de Sequelize para agregar y/o crear asociaciones
          // te va ayudar aca!
   
          agent
          .post('/api/books/' + chapterBook.id + '/chapters')
          .send({
            title: 'Chapter Made By Test',
            text: 'A chapter made by a test',
            number: 11
          })
          .expect(201)
          .end(function (err, res) {
            if (err) return done(err);
            expect(res.body.title).to.equal('Chapter Made By Test');
            var createdChapter = res.body;
            Book.findById(chapterBook.id)
            .then(function (b) {
              return b.getChapters();
            })
            .then(function (chapters) {
              var containsChapter = chapters.some(function (ch) {
                return ch.id === createdChapter.id;
              });
              expect(containsChapter).to.equal(true);
              return Chapter.findById(createdChapter.id);
            })
            .then(function (c) {
              expect(c).to.not.be.null;
              expect(res.body).to.eql(toPlainObject(c));
              done();
            })
            .catch(done);
          });
        });

        xit('GET uno', function (done) {
          var chapId = addedChapter.id;
          agent
          .get('/api/books/' + chapterBook.id + '/chapters/' + chapId)
          .expect(200)
          .end(function (err, res) {
            if (err) return done(err);
            expect(res.body.id).to.equal(chapId);
            done();
          });
        });

        xit('GET uno que no existe', function (done) {
          agent
          .get('/api/books/' + chapterBook.id + '/chapters/24680')
          .expect(404)
          .end(done);
        });

        xit('GET uno usando un ID invalido', function (done) {
          agent
          .get('/api/books/' + chapterBook.id + '/chapters/clearlynotanid')
          .expect(500)
          .end(done);
        });

        xit('PUT uno', function (done) {
          var chapId = addedChapter.id;
          agent
          .put('/api/books/' + chapterBook.id + '/chapters/' + chapId)
          .send({
            title: 'Chapter Updated By Test'
          })
          .expect(200)
          .end(function (err, res) {
            if (err) return done(err);
            expect(res.body.title).to.equal('Chapter Updated By Test');
            Chapter.findById(chapId)
            .then(function (c) {
              expect(c).to.not.be.null;
              expect(res.body).to.eql(toPlainObject(c));
              done();
            })
            .catch(done);
          });
        });

        xit('PUT uno que no existe', function (done) {
          agent
          .put('/api/books/' + chapterBook.id + '/chapters/98765')
          .send({
            title: 'Attempt To Update Chapter Title'
          })
          .expect(404)
          .end(done);
        });

        xit('PUT uno usando un ID invalido', function (done) {
          agent
          .put('/api/books/' + chapterBook.id + '/chapters/clearlynotanid')
          .send({
            title: 'Attempt To Update Chapter Title'
          })
          .expect(500)
          .end(done);
        });

        xit('DELETE uno', function (done) {
          // Mirá la documentación de Sequleize para remover asociaciones
          // va ser util aca!
          var chapId = addedChapter.id;
          agent
          .delete('/api/books/' + chapterBook.id + '/chapters/' + chapId)
          .expect(204)
          .end(function (err, res) {
            if (err) return done(err);
            Chapter.findById(chapId)
            .then(function (c) {
              expect(c).to.be.null;
              return Book.findById(chapterBook.id);
            })
            .then(function (b) {
              return b.getChapters();
            })
            .then(function (chapters) {
              chapters.forEach(function (ch) {
                expect(ch.id).to.not.equal(chapId);
              });
              done();
            })
            .catch(done);
          });
        }); 

        xit('DELETE uno que no existe', function (done) {
          agent
          .delete('/api/books/' + chapterBook.id + '/chapters/12345')
          .expect(404)
          .end(done);
        });

        xit('DELETE uno con ID invalido', function (done) {
          agent
          .delete('/api/books/' + chapterBook.id + '/chapters/clearlynotanid')
          .expect(500)
          .end(done);
        });

      });

    });

    describe('/numVisits', function () {
      // recordas express sessions?
      // https://github.com/expressjs/session

      xit('cuanta las visitas de un cliente', function (done) {
        // debería originalmente enviar zero
        // pero debería incrementar, retornano uno la siguiente vez
        var clientA = agent;
        clientA
        .get('/api/numVisits')
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          expect(res.body.number).to.equal(0);
          clientA
          .get('/api/numVisits')
          .expect(200)
          .end(function (err, res) {
            if (err) return done(err);
            expect(res.body.number).to.equal(1);
            done();
          });
        });
      });


      xit('distingue entre clientes', function (done) {
        // debería ser cero otra vez para este cliente!
        var clientB = supertest.agent(app);
        clientB
        .get('/api/numVisits')
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          expect(res.body.number).to.equal(0);
          done();
        });

      });

    });

  });

});
