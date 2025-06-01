const express = require('express');
const passport = require('passport');
const router = express.Router();
const Hotel = require('../models/soloHotel');
const Habitacion = require('../models/habitacion');
const Reserva = require('../models/reserva');
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
    const filterQuery = {};

    if (estado) filterQuery.estado = estado;
    if (nombreHotel?.trim()) {
      filterQuery.nombre = { $regex: nombreHotel.trim(), $options: 'i' };
    }

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

// Validar formato de fecha
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

    let todasLasHabitacionesDelHotel = await Habitacion.find({ hotel: hotel._id });
    let habitacionesDisponibles = [...todasLasHabitacionesDelHotel];

    if (fechasQuery) {
      const fechasDecodificadas = decodeURIComponent(fechasQuery.trim());
      const fechaArray = fechasDecodificadas.split(" a ");

      if (fechaArray.length === 2) {
        const [fechaInicioSolicitadaStr, fechaFinSolicitadaStr] = fechaArray;

        if (isValidDate(fechaInicioSolicitadaStr) && isValidDate(fechaFinSolicitadaStr)) {
          const inicioSolicitado = moment(fechaInicioSolicitadaStr, "DD/MM/YY").toDate();
          const finSolicitado = moment(fechaFinSolicitadaStr, "DD/MM/YY").toDate();

          habitacionesDisponibles = todasLasHabitacionesDelHotel.filter(habitacion => {
            if (!habitacion.reservas || habitacion.reservas.length === 0) {
              return true;
            }

            const seSolapa = habitacion.reservas.some(reservaExistente => {
              const inicioExistente = new Date(reservaExistente.fechaInicio);
              const finExistente = new Date(reservaExistente.fechaFin);
              return inicioSolicitado < finExistente && finSolicitado > inicioExistente;
            });

            return !seSolapa;
          });
        } else {
          console.error("Formato de fecha incorrecto en query:", fechaInicioSolicitadaStr, fechaFinSolicitadaStr);
        }
      } else {
        console.error("Formato de rango de fechas incorrecto en query:", fechasDecodificadas);
      }
    }

    res.render('hoteles/hotel-habitaciones', {
      hotel,
      habitaciones: habitacionesDisponibles,
      fechas: fechasQuery || ''
    });
  } catch (error) {
    console.error('Error al cargar habitaciones:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Vista de confirmación previa
router.post('/reservarHabitaciones', isAuthenticated, async (req, res) => {
  try {
    const fechas = req.body.fechas;
    const habitacionesSeleccionadas = Array.isArray(req.body.habitacionesSeleccionadas)
      ? req.body.habitacionesSeleccionadas
      : [req.body.habitacionesSeleccionadas];

    if (!habitacionesSeleccionadas.length || !fechas) {
      return res.status(400).send('Faltan datos');
    }

    const [inicioStr, finStr] = fechas.split(" a ");
    if (!isValidDate(inicioStr) || !isValidDate(finStr)) {
      return res.status(400).send("Fechas inválidas");
    }

    const inicio = moment(inicioStr, 'DD/MM/YY');
    const fin = moment(finStr, 'DD/MM/YY');
    const noches = fin.diff(inicio, 'days');

    const habitaciones = await Habitacion.find({ _id: { $in: habitacionesSeleccionadas } });
    const precioTotal = habitaciones.reduce((total, h) => total + h.precioNoche * noches, 0);

    res.render('reservacionHotel', {
      data: {
        habitaciones,
        user: req.user,
        fechas,
        precioTotal,
        numeroNoches: noches
      }
    });
  } catch (error) {
    console.error('Error al procesar la reserva:', error);
    res.status(500).send('Error interno al procesar la reserva.');
  }
});

// Simulador de pago
async function simularPago(tarjeta, vencimiento, cvv, titular) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  if (tarjeta.length !== 16 || vencimiento.length !== 4 || cvv.length !== 3) {
    return { success: false, message: 'Datos inválidos' };
  }
  return Math.random() < 0.8
    ? { success: true, transactionId: 'TRANS_' + Math.random().toString(36).substring(2) }
    : { success: false, message: 'Pago rechazado' };
}

// Confirmar reserva final
router.post('/confirmar-reserva', isAuthenticated, async (req, res) => {
  try {
    const {
      habitaciones: habitacionesData,
      fechas, precioTotal,
      nombre, email, telefono,
      tarjeta, vencimiento, cvv, titular
    } = req.body;

    if (!habitacionesData || !Array.isArray(habitacionesData) || habitacionesData.length === 0 ||
      !fechas || !precioTotal || !nombre || !email || !telefono || !tarjeta || !vencimiento || !cvv || !titular) {
      return res.status(400).send('Todos los campos son obligatorios.');
    }

    const [inicioStr, finStr] = fechas.split(" a ");
    const inicioMoment = moment(inicioStr, 'DD/MM/YY');
    const finMoment = moment(finStr, 'DD/MM/YY');
    if (!inicioMoment.isValid() || !finMoment.isValid()) {
      return res.status(400).send("Formato de fecha incorrecto.");
    }

    const inicio = inicioMoment.toDate();
    const fin = finMoment.toDate();

    const tarjetaLimpia = tarjeta.replace(/\D/g, '');
    const vencimientoLimpia = vencimiento.replace(/\D/g, '');

    const pago = await simularPago(tarjetaLimpia, vencimientoLimpia, cvv, titular);
    if (!pago.success) return res.status(400).send(`Error de pago: ${pago.message}`);

    const habitaciones = await Habitacion.find({ _id: { $in: habitacionesData.map(h => h.id || h) } });

    if (!habitaciones.length) {
      return res.status(400).send('No se encontraron habitaciones válidas.');
    }

    const hotelId = habitaciones[0].hotel; // Tomamos el hotel desde la primera habitación

    const nuevaReserva = new Reserva({
      usuario: req.user._id,
      habitaciones: habitaciones.map(h => h._id || h.id),
      hotel: hotelId,
      fechaInicio: inicio,
      fechaFin: fin,
      precioTotal,
      nombre,
      email,
      telefono,
      tarjeta: tarjetaLimpia,
      vencimiento: vencimientoLimpia,
      cvv,
      titular,
      estado: 'confirmada',
      transaccionId: pago.transactionId
    });

    await nuevaReserva.save();

    for (const h of habitaciones) {
      await Habitacion.findByIdAndUpdate(
        h._id || h.id,
        { $push: { reservas: { fechaInicio: inicio, fechaFin: fin } } },
        { new: true }
      );
    }

    res.render('confirmacionReserva', { reserva: nuevaReserva, mensaje: "¡Reserva confirmada exitosamente!" });

  } catch (error) {
    console.error('Error al confirmar la reserva:', error);
    res.status(500).send('Error interno al confirmar la reserva.');
  }
});

// Rutas de autenticación
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

router.get('/salir', (req, res) => {
  req.logOut(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

module.exports = router;

