const express = require('express');
const path = require('path');
const engine = require('ejs-mate');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');

const app = express();

// =========================
// Conexión a DB y Passport
// =========================
require('./database');
require('./passport/local-auth');

// =========================
// Configuración general
// =========================
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');

// =========================
// Archivos estáticos
// =========================
app.use(express.static(path.join(__dirname, 'public')));

// =========================
// Middlewares
// =========================
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(flash());

app.use(session({
  secret: 'mysecretsession',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// =========================
// Variables globales para vistas
// =========================
app.use((req, res, next) => {
  res.locals.mensajeRegistro = req.flash('mensajeRegistro');
  res.locals.mensajeLogin = req.flash('mensajeLogin');
  res.locals.successMessage = req.query.success || null;
  res.locals.errorMessage = req.query.error || null;
  res.locals.user = req.user || null;
  next();
});

// =========================
// Rutas del sistema
// =========================
app.use('/', require('./rutas'));
app.use('/', require('./rutas/reservas'));
app.use('/', require('./rutas/perfil'));
app.use('/admin', require('./rutas/admin'));

// Verifica si el archivo existe antes de usarlo
try {
  app.use('/resenas', require('./routes/resenas'));
} catch (err) {
  console.error("⚠️  La ruta './routes/resenas' no fue encontrada. ¿Ya la creaste?");
}

// =========================
// Iniciar el servidor
// =========================
app.listen(app.get('port'), () => {
  console.log(`🚀 Servidor iniciado en http://localhost:${app.get('port')}`);
});

