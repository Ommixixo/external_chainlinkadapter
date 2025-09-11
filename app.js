var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// Configurar timeout de Express (10 minutos)
app.use((req, res, next) => {
  req.setTimeout(10 * 60 * 1000); // 10 minutos
  res.setTimeout(10 * 60 * 1000); // 10 minutos
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', indexRouter);
app.use('/users', usersRouter);

module.exports = app;