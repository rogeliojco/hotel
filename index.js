const express = require('express');
const path = require('path');
const engine = require('ejs-mate');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');

const app = express();

// Conexión a base de datos y configuración de Passport
require('./database');
require('./passport/local-auth');

// Configuración del puerto
app.set('port', process.env.PORT || 3000);

// Configuración de vistas y motor EJS
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');

// Archivos estáticos (CSS, imágenes, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(flash());

app.use(session({
  secret: 'mysecretsession',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Variables globales disponibles en todas las vistas
app.use((req, res, next) => {
  app.locals.mensajeRegistro = req.flash('mensajeRegistro');
  app.locals.mensajeLogin = req.flash('mensajeLogin');
  app.locals.successMessage = req.query.success || null;
  app.locals.errorMessage = req.query.error || null;
  app.locals.user = req.user;
  next();
});

// Rutas del sistema
app.use('/', require('./rutas'));
app.use('/', require('./rutas/reservas'));

// Iniciar el servidor
app.listen(app.get('port'), () => {
  console.log('Servidor iniciado en el puerto', app.get('port'));
});