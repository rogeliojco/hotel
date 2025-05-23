const express = require('express');
const passport = require('passport');
const router = express.Router();
const Hotel = require('../models/soloHotel'); // Renombrado
const Habitacion = require('../models/habitacion');
const perfilController = require('../controllers/perfil_controller');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');

// Página principal
router.get('/', async (req, res) => {
  try {
    const hoteles = await Hotel.find({});
    res.render('paginaPrincipal', { hoteles });
  } catch (error) {
    console.error('Error al cargar la página principal:', error);
    res.status(500).send('Error al cargar la página principal');
  }
});

// Vista general de hoteles
router.get('/Hoteles', async (req, res) => {
  try {
    const hoteles = await Hotel.find({});
    res.render('Hoteles', { hoteles });
  } catch (error) {
    console.error('Error al obtener los hoteles:', error);
    res.status(500).send('Error al obtener los hoteles');
  }
});

// Vista de habitaciones por hotel
router.get('/hotel/:nombre', async (req, res) => {
  try {
    const nombreHotel = req.params.nombre;
    const hotel = await Hotel.findOne({ nombre: nombreHotel }); // Corregido aquí

    if (!hotel) return res.status(404).send('Hotel no encontrado');

    const habitaciones = await Habitacion.find({ hotel: hotel._id });

    res.render('hoteles/hotel-habitaciones', { hotel, habitaciones });
  } catch (error) {
    console.error('Error al cargar habitaciones:', error);
    res.status(500).send('Error interno del servidor');
  }
});





// Formulario de reservación inicial
router.post('/reservar', isAuthenticated, (req, res) => {
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
router.post('/login', (req, res, next) => {
  passport.authenticate('inicio-local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.redirect('/login');

    req.logIn(user, err => {
      if (err) return next(err);

      // Redirige según el rol del usuario
      if (user.rol === 'admin') {
        return res.redirect('/admin');
      } else {
        return res.redirect('/perfil'); // o la ruta que usas para usuarios normales
      }
    });
  })(req, res, next);
});


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