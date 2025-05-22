const express = require('express');
const passport = require('passport');
const router = express.Router();
const Producto = require('../models/Producto');
const perfilController = require('../controllers/perfil_controller');

// Estados para dropdown en página principal
const estadosMexico = [
  { id: 1, nombre: "Aguascalientes" }, { id: 2, nombre: "Baja California" }, { id: 3, nombre: "Baja California Sur" },
  { id: 4, nombre: "Campeche" }, { id: 5, nombre: "Chiapas" }, { id: 6, nombre: "Chihuahua" },
  { id: 7, nombre: "Ciudad de México" }, { id: 8, nombre: "Coahuila" }, { id: 9, nombre: "Colima" },
  { id: 10, nombre: "Durango" }, { id: 11, nombre: "Estado de México" }, { id: 12, nombre: "Guanajuato" },
  { id: 13, nombre: "Guerrero" }, { id: 14, nombre: "Hidalgo" }, { id: 15, nombre: "Jalisco" },
  { id: 16, nombre: "Michoacán" }, { id: 17, nombre: "Morelos" }, { id: 18, nombre: "Nayarit" },
  { id: 19, nombre: "Nuevo León" }, { id: 20, nombre: "Oaxaca" }, { id: 21, nombre: "Puebla" },
  { id: 22, nombre: "Querétaro" }, { id: 23, nombre: "Quintana Roo" }, { id: 24, nombre: "San Luis Potosí" },
  { id: 25, nombre: "Sinaloa" }, { id: 26, nombre: "Sonora" }, { id: 27, nombre: "Tabasco" },
  { id: 28, nombre: "Tamaulipas" }, { id: 29, nombre: "Tlaxcala" }, { id: 30, nombre: "Veracruz" },
  { id: 31, nombre: "Yucatán" }, { id: 32, nombre: "Zacatecas" }
];

// Página principal
router.get('/', (req, res) => {
  res.render('paginaPrincipal', { estados: estadosMexico });
});

// Formulario de reservación inicial
router.post('/reservar', (req, res) => {
  const { ciudad, fechas, habitacion, codigo } = req.body;
  res.render('reserva', { ciudad, fechas, habitacion, codigo });
});

// Vistas de login y registro
router.get('/login', (req, res) => res.render('login'));
router.get('/registro', (req, res) => res.render('registro'));

// Procesar registro de usuario
router.post('/registro', passport.authenticate('registro-local', {
  successRedirect: '/',
  failureRedirect: '/registro',
  passReqToCallback: true
}));

// Procesar inicio de sesión
router.post('/login', passport.authenticate('inicio-local', {
  successRedirect: '/',
  failureRedirect: '/login',
  passReqToCallback: true
}));

// Vista del perfil (y funciones relacionadas)
router.get('/perfil', isAuthenticated, perfilController.verPerfil);
router.post('/perfil/editar', isAuthenticated, perfilController.editarNombre);
router.post('/perfil/cambiar-password', isAuthenticated, perfilController.cambiarPassword);

// Cerrar sesión
router.get('/salir', (req, res, next) => {
  req.logOut(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

// Middleware para proteger rutas
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}
// Formulario de reservación desde el botón “Reservar ahora”
router.get('/reservar', isAuthenticated, (req, res) => {
  res.render('reserva', {
    ciudad: '',
    fechas: '',
    habitacion: '',
    codigo: ''
  });
});
module.exports = router;