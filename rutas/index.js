const express = require('express');
const passport = require('passport');
const router = express.Router();
const Hotel = require('../models/soloHotel');
const Habitacion = require('../models/habitacion');
const Reserva = require('../models/reserva');
const perfilController = require('../controllers/perfil_controller');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');
const moment = require('moment');

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

// Buscar hoteles
router.get('/Hoteles', async (req, res) => {
  try {
    const { estado, hotel: nombreHotel, fechas, codigo } = req.query;
    let filterQuery = {};
    if (estado) filterQuery.estado = estado;
    if (nombreHotel?.trim()) filterQuery.nombre = { $regex: nombreHotel.trim(), $options: 'i' };

    const hotelesFiltrados = await Hotel.find(filterQuery);
    const estadosUnicos = [...new Set((await Hotel.find({})).map(h => h.estado))].sort();

    res.render('Hoteles', {
      hoteles: hotelesFiltrados,
      valoresBusqueda: { estado, hotel: nombreHotel, fechas, codigo },
      estadosUnicos,
      fechas: fechas === 'undefined' || !fechas ? '' : decodeURIComponent(fechas)
    });
  } catch (error) {
    console.error('Error al obtener los hoteles:', error);
    res.status(500).send('Error al obtener los hoteles');
  }
});

// Validar formato fecha
function isValidDate(dateString) {
  return /^\d{2}\/\d{2}\/\d{2}$/.test(dateString);
}

// Ver habitaciones de un hotel
router.get('/hotel/:nombre', async (req, res) => {
  try {
    const nombreHotel = req.params.nombre;
    let fechasQuery = req.query.fechas;
    if (fechasQuery === 'undefined' || !fechasQuery?.trim()) fechasQuery = null;

    const hotel = await Hotel.findOne({ nombre: nombreHotel });
    if (!hotel) return res.status(404).send('Hotel no encontrado');

    let habitaciones = await Habitacion.find({ hotel: hotel._id });
    let disponibles = [...habitaciones];

    if (fechasQuery) {
      const fechasArray = decodeURIComponent(fechasQuery).split(" a ");
      if (fechasArray.length === 2 && isValidDate(fechasArray[0]) && isValidDate(fechasArray[1])) {
        const inicio = moment(fechasArray[0], "DD/MM/YY").toDate();
        const fin = moment(fechasArray[1], "DD/MM/YY").toDate();

        disponibles = habitaciones.filter(h => 
          !h.reservas.some(r => new Date(r.fechaInicio) < fin && new Date(r.fechaFin) > inicio)
        );
      }
    }

    res.render('hoteles/hotel-habitaciones', {
      hotel,
      habitaciones: disponibles,
      fechas: fechasQuery || ''
    });
  } catch (error) {
    console.error('Error al cargar habitaciones:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Reservar habitaciones (pre-confirmación)
router.post('/reservarHabitaciones', isAuthenticated, async (req, res) => {
  try {
    const habitacionesSeleccionadas = Array.isArray(req.body.habitacionesSeleccionadas)
      ? req.body.habitacionesSeleccionadas
      : [req.body.habitacionesSeleccionadas];

    const fechas = req.body.fechas;
    if (!habitacionesSeleccionadas.length || !fechas) return res.status(400).send('Faltan datos');

    const [inicioStr, finStr] = fechas.split(" a ");
    if (!isValidDate(inicioStr) || !isValidDate(finStr)) return res.status(400).send("Fechas inválidas");

    const inicio = moment(inicioStr, 'DD/MM/YY');
    const fin = moment(finStr, 'DD/MM/YY');
    const noches = fin.diff(inicio, 'days');

    let habitaciones = await Habitacion.find({ _id: { $in: habitacionesSeleccionadas } });
    let precioTotal = habitaciones.reduce((total, h) => total + h.precioNoche * noches, 0);

    res.render('reservacionHotel', {
      data: { habitaciones, user: req.user, fechas, precioTotal, numeroNoches: noches }
    });

  } catch (error) {
    console.error('Error al procesar la reserva:', error);
    res.status(500).send('Error interno al procesar la reserva.');
  }
});

// Simular pago
async function simularPago(tarjeta, vencimiento, cvv, titular, precio) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  if (tarjeta.length !== 16 || vencimiento.length !== 4 || cvv.length !== 3) return { success: false, message: 'Datos inválidos' };
  return Math.random() < 0.8
    ? { success: true, transactionId: 'TRANS_' + Math.random().toString(36).substring(2) }
    : { success: false, message: 'Pago rechazado' };
}

// Confirmar reserva
router.post('/confirmar-reserva', isAuthenticated, async (req, res) => {
  try {
    const {
      habitaciones: habitacionesData,
      fechas, precioTotal,
      nombre, email, telefono,
      tarjeta, vencimiento, cvv, titular
    } = req.body;

    const habitacionesArray = typeof habitacionesData === 'string'
      ? JSON.parse(habitacionesData)
      : habitacionesData;

    const [inicioStr, finStr] = fechas.split(" a ");
    const inicio = moment(inicioStr, 'DD/MM/YY').toDate();
    const fin = moment(finStr, 'DD/MM/YY').toDate();

    const pago = await simularPago(tarjeta.replace(/\D/g, ''), vencimiento.replace(/\D/g, ''), cvv, titular, precioTotal);
    if (!pago.success) return res.status(400).send(pago.message);

    const reserva = new Reserva({
      usuario: req.user._id,
      habitaciones: habitacionesArray.map(h => h.id),
      fechaInicio: inicio,
      fechaFin: fin,
      precioTotal,
      nombre, email, telefono, tarjeta, vencimiento, cvv, titular
    });

    await reserva.save();

    for (const h of habitacionesArray) {
      await Habitacion.findByIdAndUpdate(h.id, {
        $push: { reservas: { fechaInicio: inicio, fechaFin: fin } }
      });
    }

    res.render('confirmacionReserva', { reserva, mensaje: "¡Reserva confirmada exitosamente!" });

  } catch (error) {
    console.error('Error al confirmar la reserva:', error);
    res.status(500).send('Error interno al confirmar la reserva.');
  }
});

// Rutas públicas
router.get('/login', (req, res) => res.render('login'));
router.get('/registro', (req, res) => res.render('registro'));

router.post('/registro', passport.authenticate('registro-local', {
  successRedirect: '/',
  failureRedirect: '/registro',
  passReqToCallback: true
}));

router.post('/login', (req, res, next) => {
  passport.authenticate('inicio-local', (err, user) => {
    if (err) return next(err);
    if (!user) return res.redirect('/login');
    req.logIn(user, err => {
      if (err) return next(err);
      return res.redirect(user.rol === 'admin' ? '/admin' : '/perfil');
    });
  })(req, res, next);
});

// Perfil
router.get('/perfil', isAuthenticated, perfilController.verPerfil);
router.post('/perfil/editar', isAuthenticated, perfilController.editarNombre);
router.post('/perfil/cambiar-password', isAuthenticated, perfilController.cambiarPassword);

// Salir
router.get('/salir', (req, res) => {
  req.logOut(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

module.exports = router;
