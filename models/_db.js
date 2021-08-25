var Sequelize = require("sequelize");

var db = new Sequelize("checkpoint_practice_express", "oken02", "nose123", {
  logging: false,
  dialect:"postgres"
});

module.exports = db;
