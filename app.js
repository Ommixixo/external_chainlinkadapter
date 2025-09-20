var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Agrocostos API',
      version: '1.0.0',
      description: 'API para obtener información de agrocostos de FIRA',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://tu-app-url.appspot.com' 
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
  },
  apis: ['./routes/*.js'], // archivos que contienen anotaciones de Swagger
};

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

const specs = swaggerJsdoc(swaggerOptions);

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

// Configurar Swagger
app.use('/documentation', swaggerUi.serve, swaggerUi.setup(specs));

app.use('/api', indexRouter);
app.use('/users', usersRouter);

module.exports = app;