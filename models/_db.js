var Sequelize = require("sequelize");

var db = new Sequelize(
  "postgres://localhost:5432/checkpoint_practice_express",
  {
    logging: false,
  }
);

module.exports = db;
