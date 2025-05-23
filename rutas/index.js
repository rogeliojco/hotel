const express = require('express');
const passport = require('passport');
const router = express.Router();
const hotel = require('../models/hotel');
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
// Página principal
router.get('/', async (req, res) => {
  try {
    // Obtén los hoteles desde la base de datos
    const hoteles = await hotel.find({}); // Asegúrate de haber importado el modelo 'hotel'

    // Renderiza la vista con estados y hoteles
    res.render('paginaPrincipal', {
      estados: estadosMexico,
      hoteles: hoteles
    });
  } catch (error) {
    console.error('Error al cargar la página principal:', error);
    res.status(500).send('Error al cargar la página principal');
  }
});


router.get('/Hoteles', async (req, res) => {
  try {
    // Obtén todos los hoteles de la base de datos
    const hoteles = await hotel.find({}); // Usa el modelo 'hotel' para buscar todos los documentos

    // Renderiza la vista 'Hoteles' y pasa los datos de los hoteles
    res.render('Hoteles', { hoteles: hoteles, estados: estadosMexico }); // Pasa 'hoteles' a la vista
  } catch (error) {
    console.error('Error al obtener los hoteles:', error);
    res.status(500).send('Error al obtener los hoteles'); // Manejo de errores
  }
});


// Mostrar formulario (vista: views/hoteles/formularioHotel.ejs)
router.get('/FormularioHotel', (req, res) => {
  res.render('hoteles/formularioHotel'); // Asegúrate de que está en views/hoteles/
});

// (Opcional) redirigir /nuevo al formulario
router.get('/nuevo', (req, res) => {
  res.redirect('/hoteles/FormularioHotel');
});

// Procesar formulario enviado desde /FormularioHotel (action="/hoteles/nuevo")
// POST /nuevo
router.post('/nuevo', async (req, res) => {
  try {
    const nuevoHotel = new hotel({
      nombre: req.body.nombre,
      descripcionCorta: req.body.descripcionCorta,
      zona: req.body.zona,
      distanciaCentro: req.body.distanciaCentro,
      estaCercaDe: {
        tipo: req.body.tipo,
        distancia: req.body.distanciaCercana
      },
      estado: req.body.estado,
      habitacionesDisponibles: {
        unaPersona: req.body.unaPersona,
        dosPersonas: req.body.dosPersonas,
        cuatroPersonas: req.body.cuatroPersonas,
        seisPersonas: req.body.seisPersonas
      },
      detallesHabitacion: req.body.detallesHabitacion,
      calificacionGeneral: req.body.calificacionGeneral,
      numeroComentarios: req.body.numeroComentarios,
      preciosNoche: {
        unaPersona: req.body.precioUna,
        dosPersonas: req.body.precioDos,
        cuatroPersonas: req.body.precioCuatro,
        seisPersonas: req.body.precioSeis
      },
      impuestosCargos: req.body.impuestosCargos,
      ubicacion: req.body.ubicacion,
      urlImagen: req.body.urlImagen,
      aceptaMascotas: req.body.aceptaMascotas === 'on',
      horaCheckIn: req.body.horaCheckIn,
      horaCheckOut: req.body.horaCheckOut,
      latitud: req.body.latitud,
      longitud: req.body.longitud,
      calle: req.body.calle,
      numero: req.body.numero,
      codigoPostal: req.body.codigoPostal,
      telefono: req.body.telefono,
      email: req.body.email,
      servicios: Array.isArray(req.body.servicios)
        ? req.body.servicios
        : req.body.servicios
        ? [req.body.servicios]
        : []
    });

    await nuevoHotel.save();
    res.render('hoteles/formularioHotel', { mensajeExito: '✅ ¡El hotel se registró correctamente!' });
  } catch (err) {
    res.status(500).send('Error al guardar el hotel: ' + err.message);
  }
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