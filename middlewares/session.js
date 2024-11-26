const session = require("express-session");

module.exports = session({
  secret: "your_secret_key",
  resave: false,
  saveUninitialized: true,
});
