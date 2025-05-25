const express = require('express');
const passport = require('passport');
const router = express.Router();
const Hotel = require('../models/soloHotel');
const Habitacion = require('../models/habitacion');
const Reserva = require('../models/reserva');
const perfilController = require('../controllers/perfil_controller');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');
const moment = require('moment'); // Importa moment.js

router.use(express.urlencoded({ extended: true }));

router.get('/', async (req, res) => {
  try {
    const hoteles = await Hotel.find({});
    res.render('paginaPrincipal', { hoteles });
  } catch (error) {
    console.error('Error al cargar la página principal:', error);
    res.status(500).send('Error al cargar la página principal');
  }
});


router.get('/Hoteles', async (req, res) => {
  try {
    // Recoger todos los parámetros de búsqueda de req.query
    const { estado, hotel: nombreHotel, fechas, codigo } = req.query;

    let filterQuery = {};

    if (estado && estado !== "") {
      filterQuery.estado = estado;
    }
    if (nombreHotel && nombreHotel.trim() !== "") {
      // Búsqueda flexible por nombre de hotel (case-insensitive, parcial)
      filterQuery.nombre = { $regex: nombreHotel.trim(), $options: 'i' };
    }

    // Aquí aún no filtramos por fechas, ya que eso usualmente se hace
    // para la disponibilidad de habitaciones, no para la lista de hoteles.
    // Pero pasaremos 'fechas' a la vista para rellenar el campo.

    const hotelesFiltrados = await Hotel.find(filterQuery);

    // Necesitamos todos los estados únicos para el dropdown en Hoteles.ejs
    const todosLosHoteles = await Hotel.find({}); // Podrías optimizar esto si solo necesitas estados
    const estadosUnicos = [...new Set(todosLosHoteles.map(h => h.estado))].sort();


    res.render('Hoteles', {
      hoteles: hotelesFiltrados,
      // Pasa los valores de búsqueda para rellenar el formulario en Hoteles.ejs
      valoresBusqueda: {
        estado: estado || '',
        hotel: nombreHotel || '',
        fechas: fechas || '',
        codigo: codigo || ''
      },
      estadosUnicos: estadosUnicos, // Para el dropdown de estados
      // También puedes pasar 'fechas' directamente si lo prefieres en la vista
      // para el enlace "Ver disponibilidad", aunque ya está en valoresBusqueda.
      // Si el 'fechas' del query es 'undefined' (string), cámbialo a cadena vacía
      fechas: (fechas === 'undefined' || !fechas) ? '' : decodeURIComponent(fechas)
    });
  } catch (error) {
    console.error('Error al obtener los hoteles:', error);
    res.status(500).send('Error al obtener los hoteles');
  }
});




function isValidDate(dateString) {
  // Expresión regular para el formato dd/mm/yy
  const dateRegex = /^\d{2}\/\d{2}\/\d{2}$/;
  return dateRegex.test(dateString);
}



router.get('/hotel/:nombre', async (req, res) => {
  try {
    const nombreHotel = req.params.nombre;
    let fechasQuery = req.query.fechas; // Renombré 'fechas' a 'fechasQuery' para evitar confusión

    // Normalizar fechasQuery: si es 'undefined' (string), null, o vacío, se trata como null.
    if (fechasQuery === 'undefined' || !fechasQuery || fechasQuery.trim() === '') {
      fechasQuery = null;
    }

    const hotel = await Hotel.findOne({ nombre: nombreHotel });
    if (!hotel) {
      console.log(`Hotel no encontrado: ${nombreHotel}`);
      return res.status(404).send('Hotel no encontrado');
    }

    // Obtener TODAS las habitaciones del hotel primero
    let todasLasHabitacionesDelHotel = await Habitacion.find({ hotel: hotel._id });
    let habitacionesDisponibles = [...todasLasHabitacionesDelHotel]; // Copiamos para filtrar

    console.log(`Ruta /hotel/${nombreHotel} - Fechas solicitadas (query): ${fechasQuery}`);

    if (fechasQuery) {
      const fechasDecodificadas = decodeURIComponent(fechasQuery.trim());
      console.log("Fechas decodificadas:", fechasDecodificadas);
      const fechaArray = fechasDecodificadas.split(" a ");

      if (fechaArray.length === 2) {
        const [fechaInicioSolicitadaStr, fechaFinSolicitadaStr] = fechaArray;

        if (isValidDate(fechaInicioSolicitadaStr) && isValidDate(fechaFinSolicitadaStr)) {
          // Convertir fechas solicitadas a objetos Date de JS
          // ¡IMPORTANTE! Usar moment para parsear y luego .toDate() para comparar con las fechas de la BD
          // que también son objetos Date.
          const inicioSolicitado = moment(fechaInicioSolicitadaStr, "DD/MM/YY").toDate();
          const finSolicitado = moment(fechaFinSolicitadaStr, "DD/MM/YY").toDate();

          // Ajustar finSolicitado para que la comparación sea inclusiva del último día
          // Si una reserva termina el día X, y la nueva empieza el día X, no hay conflicto.
          // La lógica de conflicto es:
          // (reserva.fechaFin > inicioSolicitado && reserva.fechaInicio < finSolicitado)
          // Esto significa que hay solapamiento si el final de una reserva existente es DESPUÉS
          // del inicio solicitado Y el inicio de la reserva existente es ANTES del final solicitado.

          console.log(`Rango solicitado: Inicio=${inicioSolicitado}, Fin=${finSolicitado}`);

          habitacionesDisponibles = todasLasHabitacionesDelHotel.filter(habitacion => {
            if (!habitacion.reservas || habitacion.reservas.length === 0) {
              // Si no tiene reservas, está disponible
              console.log(`Habitación ${habitacion.nombre}: Sin reservas, disponible.`);
              return true;
            }

            // Verificar si ALGUNA reserva existente se solapa con el rango solicitado
            const seSolapa = habitacion.reservas.some(reservaExistente => {
              // Asegurarse que las fechas de reservaExistente son objetos Date
              const inicioExistente = new Date(reservaExistente.fechaInicio);
              const finExistente = new Date(reservaExistente.fechaFin);

              // Lógica de solapamiento:
              // Un solapamiento ocurre si:
              // El inicio solicitado es ANTES del fin de la reserva existente Y
              // El fin solicitado es DESPUÉS del inicio de la reserva existente.
              const haySolapamiento = inicioSolicitado < finExistente && finSolicitado > inicioExistente;

              if (haySolapamiento) {
                console.log(`Habitación ${habitacion.nombre}: CONFLICTO con reserva existente [${inicioExistente.toLocaleDateString()} - ${finExistente.toLocaleDateString()}] para el rango solicitado [${inicioSolicitado.toLocaleDateString()} - ${finSolicitado.toLocaleDateString()}]`);
              }
              return haySolapamiento;
            });

            if (!seSolapa) {
              console.log(`Habitación ${habitacion.nombre}: DISPONIBLE para el rango solicitado.`);
            }
            return !seSolapa; // La habitación está disponible si NO se solapa con NINGUNA reserva existente
          });

        } else {
          console.error("Formato de fecha incorrecto en query:", fechaInicioSolicitadaStr, fechaFinSolicitadaStr);
          // No se filtrará por fechas si el formato es incorrecto, se mostrarán todas las habitaciones.
          // Podrías optar por enviar un error 400 aquí si lo prefieres.
          // return res.status(400).send("Formato de fecha incorrecto. Debe ser dd/mm/yy");
        }
      } else {
        console.error("Formato de rango de fechas incorrecto en query:", fechasDecodificadas);
        // No se filtrará por fechas si el formato es incorrecto.
        // return res.status(400).send("Formato de fechas incorrecto. Debe ser 'fechaInicio a fechaFin'");
      }
    } else {
      console.log("No se proporcionaron fechas, mostrando todas las habitaciones del hotel.");
    }

    // Renderizar con las habitaciones (filtradas o todas) y las fechas originales del query
    res.render('hoteles/hotel-habitaciones', {
      hotel,
      habitaciones: habitacionesDisponibles,
      fechas: fechasQuery || '' // Pasar las fechas originales del query (o vacío) a la vista
    });

  } catch (error) {
    console.error('Error al cargar habitaciones:', error);
    res.status(500).send('Error interno del servidor');
  }
});



router.post('/reservarHabitaciones', isAuthenticated, async (req, res) => {
  try {
    const habitacionesSeleccionadas = req.body.habitacionesSeleccionadas;
    const fechas = req.body.fechas;

    if (!habitacionesSeleccionadas || habitacionesSeleccionadas.length === 0) {
      return res.status(400).send('Debes seleccionar al menos una habitación.');
    }

    const habitacionesSeleccionadasIds = Array.isArray(habitacionesSeleccionadas) ? habitacionesSeleccionadas : [habitacionesSeleccionadas];

    let numeroNoches = 0;
    let fechaInicio;
    let fechaFin;

    // Verificar la disponibilidad de las habitaciones
    if (fechas) {
      const [fechaInicioStr, fechaFinStr] = fechas.split(" a ");

      if (isValidDate(fechaInicioStr) && isValidDate(fechaFinStr)) {
        fechaInicio = moment(fechaInicioStr, 'DD/MM/YY');
        fechaFin = moment(fechaFinStr, 'DD/MM/YY');
        numeroNoches = fechaFin.diff(fechaInicio, 'days');
        console.log("Noches", numeroNoches);

        // Verificar la disponibilidad de cada habitación seleccionada
        for (const habitacionId of habitacionesSeleccionadasIds) {
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
            const inicioSolicitado = fechaInicio.utc().startOf('day').toDate();
            const finSolicitado = fechaFin.utc().startOf('day').toDate();

            // Verificar si hay conflicto:
            // No hay conflicto si el fin de la reserva solicitada es anterior o igual al inicio de la reserva existente
            // O si el inicio de la reserva solicitada es posterior o igual al fin de la reserva existente
            return !(finSolicitado <= inicioReserva || inicioSolicitado >= finReserva);
          });

          if (!disponible) {
            return res.status(400).send(`La habitación ${habitacion.nombre} no está disponible en las fechas seleccionadas.`);
          }
        }
      } else {
        return res.status(400).send("Formato de fecha incorrecto. Debe ser dd/mm/yy");
      }
    }

    const habitaciones = await Habitacion.find({ _id: { $in: habitacionesSeleccionadasIds } });
    const user = req.user;

    // Calcula el precio total
    let precioTotal = 0;
    habitaciones.forEach(habitacion => {
      precioTotal += habitacion.precioNoche * numeroNoches;
    });

    console.log("Datos que se pasan a reservacionHotel.ejs:", {
      habitaciones: habitaciones,
      user: user,
      fechas: fechas,
      precioTotal: precioTotal,
      numeroNoches: numeroNoches
    });

    res.render('reservacionHotel', {
      data: {
        habitaciones: habitaciones,
        user: user,
        fechas: fechas,
        precioTotal: precioTotal,
        numeroNoches: numeroNoches
      }
    });

  } catch (error) {
    console.error('Error al procesar la reserva:', error);
    res.status(500).send('Error al procesar la reserva.');
  }
});


async function simularPago(tarjeta, vencimiento, cvv, titular, precioTotal) {
  // ... (tu lógica de simulación de pago)
  await new Promise(resolve => setTimeout(resolve, 1000));
  if (tarjeta.length !== 16 || vencimiento.length !== 4 || cvv.length !== 3) {
    return { success: false, message: 'Datos de tarjeta inválidos.' };
  }
  const randomNumber = Math.random();
  if (randomNumber < 0.8) {
    return { success: true, transactionId: 'TRANSACCION_' + Math.random().toString(36).substring(7) };
  } else {
    return { success: false, message: 'Pago rechazado por el banco.' };
  }
}


router.post('/confirmar-reserva', isAuthenticated, async (req, res) => {
  try {
    const {
      habitaciones: habitacionesData, // Array de objetos con id, nombre, precioNoche
      fechas,
      precioTotal,
      // numeroNoches, // Ya no lo necesitamos directamente aquí si las fechas son el origen
      nombre: nombreCliente, // Renombrado para evitar confusión con nombre de habitación
      email,
      telefono,
      tarjeta,
      vencimiento,
      cvv,
      titular
    } = req.body;

    // --- Validación de Datos Recibidos ---
    if (
      !habitacionesData ||
      !Array.isArray(habitacionesData) ||
      habitacionesData.length === 0 ||
      !fechas ||
      !precioTotal ||
      !nombreCliente ||
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
    const [fechaInicioStr, fechaFinStr] = fechas.split(" a ");
    const fechaInicioMoment = moment(fechaInicioStr, 'DD/MM/YY');
    const fechaFinMoment = moment(fechaFinStr, 'DD/MM/YY');

    if (!fechaInicioMoment.isValid() || !fechaFinMoment.isValid()) {
      return res.status(400).send("Formato de fecha incorrecto. Debe ser DD/MM/YY a DD/MM/YY");
    }

    const fechaInicioDate = fechaInicioMoment.toDate();
    const fechaFinDate = fechaFinMoment.toDate(); // Convertir a Date de JS para guardar en MongoDB

    // --- Limpiar y Validar Datos de Tarjeta ---
    const tarjetaLimpia = tarjeta.replace(/[^0-9]/g, '');
    const vencimientoLimpia = vencimiento.replace(/[^0-9]/g, '');

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
    const pago = await simularPago(tarjetaLimpia, vencimientoLimpia, cvv, titular, precioTotal);
    if (!pago.success) {
      return res.status(400).send(`Error al procesar el pago: ${pago.message}`);
    }

    // --- Crear el Documento de Reserva ---
    // Extraer solo los IDs de las habitaciones para el modelo Reserva
    const habitacionesIds = habitacionesData.map(h => h.id);

    const nuevaReserva = new Reserva({
      usuario: req.user._id,
      habitaciones: habitacionesIds,
      fechaInicio: fechaInicioDate,
      fechaFin: fechaFinDate,
      precioTotal: precioTotal,
      nombre: nombreCliente,
      email: email,
      telefono: telefono,
      transaccionId: pago.transactionId,
      tarjeta: tarjetaLimpia,
      vencimiento: vencimientoLimpia,
      cvv: cvv,
      titular: titular
    });

    await nuevaReserva.save();
    console.log("Nueva reserva guardada:", nuevaReserva._id);

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
                fechaInicio: fechaInicioDate,
                fechaFin: fechaFinDate
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

router.post('/reservar', isAuthenticated, (req, res) => {
  const { ciudad, fechas, habitacion, codigo } = req.body;
  res.render('reserva', { ciudad, fechas, habitacion, codigo });
});

router.get('/login', (req, res) => res.render('login'));
router.get('/registro', (req, res) => res.render('registro'));

router.post('/registro', passport.authenticate('registro-local', {
  successRedirect: '/',
  failureRedirect: '/registro',
  passReqToCallback: true
}));

router.post('/login', (req, res, next) => {
  passport.authenticate('inicio-local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.redirect('/login');

    req.logIn(user, err => {
      if (err) return next(err);

      if (user.rol === 'admin') {
        return res.redirect('/admin');
      } else {
        return res.redirect('/perfil');
      }
    });
  })(req, res, next);
});

router.get('/perfil', isAuthenticated, perfilController.verPerfil);
router.post('/perfil/editar', isAuthenticated, perfilController.editarNombre);
router.post('/perfil/cambiar-password', isAuthenticated, perfilController.cambiarPassword);

router.get('/salir', (req, res, next) => {
  req.logOut(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

router.get('/reservar', isAuthenticated, (req, res) => {
  res.render('reserva', {
    ciudad: '',
    fechas: '',
    habitacion: '',
    codigo: ''
  });
});

module.exports = router;