const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const userRouter = require("./router/userRouter");

// Middleware
app.use(express.json());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// User Route
app.use("/api/user", userRouter);

module.exports = app;
