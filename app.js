var express = require("express");

var app = express();

const apiRoutes = require("./routes");

app.use("/files", express.static("public/static"));
app.use(express.json())

app.use("/api", apiRoutes);


app.use("/forbidden", (req, res) => {
  return res.sendStatus(403);
});

app.use("/", (req, res) => {
  return res.sendStatus(500);
});

module.exports = app;
