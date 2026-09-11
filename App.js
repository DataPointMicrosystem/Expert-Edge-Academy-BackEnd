const expressSession = require("express-session");
const { passport } = require("./middleware/passport");
const express = require("express");
const authRouter = require("./routes/authRouter");

const app = express();
app.use(express.json());

app.use(
  expressSession({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(passport.initialize());
app.use(passport.session());

app.use(authRouter);

module.exports = app;
