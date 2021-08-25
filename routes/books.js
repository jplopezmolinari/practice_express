const { Book } = require("../models");

const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  const options = req.query.title ? { where: { title: req.query.title } } : {};

  Book.findAll(options).then((books) => {
    res.json(books);
  });
});

router.post("/", (req, res) => {
  Book.create(req.body).then((book) => {
    res.status(201).json(book);
  });
});

router.get("/:id", (req, res) => {
  Book.findByPk(req.params.id)
    .then((book) => {
      if (!book) {
        return res.sendStatus(404);
      }
      res.json(book);
    })
    .catch((err) => {
      res.sendStatus(500);
    });
});

router.put("/:id", (req, res) => {
  const id = req.params.id;
  Book.update(req.body, {
    where: {
      id,
    },
  })
    .then(([cant]) => {
      if (cant === 0) {
        return res.sendStatus(404);
      }
      Book.findByPk(id).then((bookUpdated) => {
        res.json(bookUpdated);
      });
    })

    .catch((err) => {
      res.sendStatus(500);
    });
});

router.delete("/:id", (req, res) => {
  Book.destroy({
    where: {
      id: req.params.id,
    },
  })
    .then((resdb) => {
      if (resdb === 0) {
        return res.sendStatus(404);
      }
      res.sendStatus(204);
    })
    .catch((err) => {
      return res.sendStatus(500);
    });
});

module.exports = router;
