const express = require("express");

const booksRouter = require("./books");
const router = express.Router();

router.use("/books", booksRouter);

module.exports = router;
