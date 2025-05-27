const express = require('express');
const passport = require('passport');
const router = express.Router();
const Hotel = require('../models/soloHotel');
const Habitacion = require('../models/habitacion');
const Reserva = require('../models/reserva');
const perfilController = require('../controllers/perfilController'); // Asegúrate de que el nombre del archivo sea correcto
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

// Habitaciones de un hotel
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

              const haySolapamiento = inicioSolicitado < finExistente && finSolicitado > inicioExistente;

              return haySolapamiento;
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

// Reservar habitaciones (pre-confirmación)
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

    // Validación de Disponibilidad (Importante!)
    for (const habitacionId of habitacionesSeleccionadas) {
        const habitacion = await Habitacion.findById(habitacionId);
        if (!habitacion) {
            return res.status(404).send(`Habitación con ID ${habitacionId} no encontrada.`);
        }
        const disponible = !habitacion.reservas.some(reserva => {
            const reservaFechaInicio = moment(reserva.fechaInicio);
            const reservaFechaFin = moment(reserva.fechaFin);

            // Convertir a UTC y luego a Date sin hora, minutos, segundos y milisegundos
            const inicioReserva = reservaFechaInicio.utc().startOf('day').toDate();
            const finReserva = reservaFechaFin.utc().startOf('day').toDate();
            const inicioSolicitado = inicio.utc().startOf('day').toDate();
            const finSolicitado = fin.utc().startOf('day').toDate();

            // Verificar si hay conflicto:
            // No hay conflicto si el fin de la reserva solicitada es anterior o igual al inicio de la reserva existente
            // O si el inicio de la reserva solicitada es posterior o igual al fin de la reserva existente
            return !(finSolicitado <= inicioReserva || inicioSolicitado >= finReserva);
        });
        if (!disponible) {
            return res.status(400).send(`La habitación ${habitacion.nombre} no está disponible en las fechas seleccionadas.`);
        }
    }

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

// Simular pago
async function simularPago(tarjeta, vencimiento, cvv, titular) { // Eliminé precio
  await new Promise(resolve => setTimeout(resolve, 1000));
  if (tarjeta.length !== 16 || vencimiento.length !== 4 || cvv.length !== 3) {
    return { success: false, message: 'Datos inválidos' };
  }
  return Math.random() < 0.8
    ? { success: true, transactionId: 'TRANS_' + Math.random().toString(36).substring(2) }
    : { success: false, message: 'Pago rechazado' };
}

// Confirmar reserva
router.post('/confirmar-reserva', isAuthenticated, async (req, res) => {
  try {
    const {
      habitaciones: habitacionesData, // Array de objetos con id, nombre, precioNoche
      fechas, precioTotal,
      nombre, email, telefono,
      tarjeta, vencimiento, cvv, titular
    } = req.body;

    // --- Validación de Datos Recibidos ---
    if (
      !habitacionesData ||
      !Array.isArray(habitacionesData) ||
      habitacionesData.length === 0 ||
      !fechas ||
      !precioTotal ||
      !nombre ||
      !email ||
      !telefono ||
      !tarjeta ||
      !vencimiento ||
      !cvv ||
      !titular
    ) {
      console.error("Datos incompletos:", req.body);
      return res.status(400).send('Todos los campos son obligatorios y debe haber al menos una habitación.');
    }

    // --- Procesar Fechas ---
    const [inicioStr, finStr] = fechas.split(" a ");
    const inicioMoment = moment(inicioStr, 'DD/MM/YY');
    const finMoment = moment(finStr, 'DD/MM/YY');

    if (!inicioMoment.isValid() || !finMoment.isValid()) {
      return res.status(400).send("Formato de fecha incorrecto. Debe ser DD/MM/YY a DD/MM/YY");
    }

    const inicio = inicioMoment.toDate();
    const fin = finMoment.toDate();

    // --- Limpiar y Validar Datos de Tarjeta ---
    const tarjetaLimpia = tarjeta.replace(/\D/g, '');
    const vencimientoLimpia = vencimiento.replace(/\D/g, '');

    if (tarjetaLimpia.length !== 16) {
      return res.status(400).send('Número de tarjeta inválido. Debe contener 16 dígitos.');
    }

    if (vencimientoLimpia.length !== 4) {
      return res.status(400).send('Fecha de vencimiento inválida. Debe contener 4 dígitos (MMAA).');
    }

    if (cvv.length !== 3) {
      return res.status(400).send('CVV inválido. Debe contener 3 dígitos.');
    }

    // --- Simular Pago ---
    const pago = await simularPago(tarjetaLimpia, vencimientoLimpia, cvv, titular); // Eliminé precioTotal
    if (!pago.success) return res.status(400).send(`Error al procesar el pago: ${pago.message}`);

    // --- Crear el Documento de Reserva ---
    const habitacionesIds = habitacionesData.map(h => h.id);

    const nuevaReserva = new Reserva({
      usuario: req.user._id,
      habitaciones: habitacionesIds,
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
      transaccionId: pago.transactionId //Guardar id de transacción
    });

    await nuevaReserva.save();

    // --- ACTUALIZAR CADA HABITACIÓN CON LAS FECHAS DE LA RESERVA ---
    for (const habitacionInfo of habitacionesData) {
      try {
        const habitacionId = habitacionInfo.id;
        // Usamos findOneAndUpdate para añadir el nuevo rango de fechas al array 'reservas'
        // de la habitación correspondiente.
        const habitacionActualizada = await Habitacion.findByIdAndUpdate(
          habitacionId,
          {
            $push: { // $push añade un elemento a un array
              reservas: {
                fechaInicio: inicio,
                fechaFin: fin
                // Opcional: podrías añadir el ID de la reserva aquí si quieres una referencia cruzada
                // reservaId: nuevaReserva._id
              }
            }
          },
          { new: true } // Devuelve el documento modificado
        );

        if (!habitacionActualizada) {
          // Esto sería un error grave si la habitación existía al principio del proceso
          console.error(`Error: No se pudo encontrar la habitación con ID ${habitacionId} para actualizar sus fechas de reserva.`);
          // Podrías considerar revertir la reserva principal aquí o marcarla para revisión.
        } else {
          console.log(`Habitación ${habitacionActualizada.nombre} (ID: ${habitacionId}) actualizada con nuevas fechas de reserva.`);
        }
      } catch (errorActualizandoHabitacion) {
        console.error(`Error al actualizar la habitación con ID ${habitacionInfo.id}:`, errorActualizandoHabitacion);
        // Manejar el error: podrías decidir si la reserva principal sigue siendo válida
        // o si necesitas revertir/marcarla.
      }
    }

    res.render('confirmacionReserva', { reserva: nuevaReserva, mensaje: "¡Reserva confirmada exitosamente!" });

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

// Cerrar sesión
router.get('/salir', (req, res) => {
  req.logOut(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

module.exports = router;