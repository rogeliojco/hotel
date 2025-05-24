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
        const estado = req.query.estado;
        const fechas = req.query.fechas;

        let hoteles;

        if (estado) {
            hoteles = await Hotel.find({ estado: estado });
        } else {
            hoteles = await Hotel.find({});
        }

        res.render('Hoteles', { hoteles: hoteles, fechas: fechas });
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
        let fechas = req.query.fechas;
        const hotel = await Hotel.findOne({ nombre: nombreHotel });

        if (!hotel) return res.status(404).send('Hotel no encontrado');

        let habitaciones = await Habitacion.find({ hotel: hotel._id });

        // Si hay fechas seleccionadas, filtrar las habitaciones
        if (fechas) {
            fechas = decodeURIComponent(fechas);
            console.log("Valor de fechas en /hotel/:nombre (después de decode):", fechas);
            const fechaArray = fechas.split(" a ");

            if (fechaArray.length === 2) {
                const [fechaInicioStr, fechaFinStr] = fechaArray;

                if (isValidDate(fechaInicioStr) && isValidDate(fechaFinStr)) {
                    const fechaInicio = new Date(fechaInicioStr.split('/').reverse().join('-'));
                    const fechaFin = new Date(fechaFinStr.split('/').reverse().join('-'));

                    habitaciones = habitaciones.filter(habitacion => {
                        return !habitacion.reservas.some(reserva => {
                            return !(reserva.fechaFin < fechaInicio || reserva.fechaInicio > fechaFin);
                        });
                    });
                } else {
                    console.error("Formato de fecha incorrecto:", fechaInicioStr, fechaFinStr);
                    return res.status(400).send("Formato de fecha incorrecto. Debe ser dd/mm/yy");
                }
            } else {
                console.error("Formato de fechas incorrecto:", fechas);
                return res.status(400).send("Formato de fechas incorrecto. Debe ser 'fechaInicio a fechaFin'");
            }
        }

        // La variable habitaciones siempre está definida aquí
        res.render('hoteles/hotel-habitaciones', { hotel, habitaciones, fechas: fechas });
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

        let numeroNoches = 0; // Definir numeroNoches aquí
        let fechaInicio;
        let fechaFin;

        // Verificar la disponibilidad de las habitaciones
        if (fechas) {
            const [fechaInicioStr, fechaFinStr] = fechas.split(" a ");

            if (isValidDate(fechaInicioStr) && isValidDate(fechaFinStr)) {
                // Usa moment.js para convertir las fechas al formato deseado
                fechaInicio = moment(fechaInicioStr, 'DD/MM/YY');
                fechaFin = moment(fechaFinStr, 'DD/MM/YY');
                numeroNoches = fechaFin.diff(fechaInicio, 'days'); // Calcula el número de noches
                console.log("Noches", numeroNoches);

                // Verificar la disponibilidad de cada habitación seleccionada
                for (const habitacionId of habitacionesSeleccionadasIds) {
                    const habitacion = await Habitacion.findById(habitacionId);

                    if (!habitacion) {
                        return res.status(404).send(`Habitación con ID ${habitacionId} no encontrada.`);
                    }

                    const disponible = !habitacion.reservas.some(reserva => {
                        return !(reserva.fechaFin < fechaInicio.toDate() || reserva.fechaInicio > fechaFin.toDate());
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

        console.log("Datos que se pasan a reservacionHotel.ejs:", { // Agrega este console.log
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

// Función para simular el procesamiento del pago
async function simularPago(tarjeta, vencimiento, cvv, titular, precioTotal) {
    // Simula un tiempo de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simula la validación de la tarjeta
    if (tarjeta.length !== 16 || vencimiento.length !== 4 || cvv.length !== 3) {
        return { success: false, message: 'Datos de tarjeta inválidos.' };
    }

    // Simula la aprobación del pago
    const randomNumber = Math.random();
    if (randomNumber < 0.8) { // 80% de probabilidad de éxito
        return { success: true, transactionId: 'TRANSACCION_' + Math.random().toString(36).substring(7) };
    } else {
        return { success: false, message: 'Pago rechazado por el banco.' };
    }
}

router.post('/confirmar-reserva', isAuthenticated, async (req, res) => {
    try {
        const habitaciones = req.body.habitaciones;
        const fechas = req.body.fechas;
        const precioTotal = req.body.precioTotal;
        const numeroNoches = req.body.numeroNoches;
        const nombre = req.body.nombre;
        const email = req.body.email;
        const telefono = req.body.telefono;
        const tarjeta = req.body.tarjeta;
        const vencimiento = req.body.vencimiento;
        const cvv = req.body.cvv;
        const titular = req.body.titular;

        // Validar los datos recibidos
        if (!habitaciones || !fechas || !precioTotal || !nombre || !email || !telefono || !tarjeta || !vencimiento || !cvv || !titular) {
            return res.status(400).send('Todos los campos son obligatorios.');
        }

         // Simular el procesamiento del pago
         const pago = await simularPago(tarjeta, vencimiento, cvv, titular, precioTotal);

         if (!pago.success) {
             return res.status(400).send(`Error al procesar el pago: ${pago.message}`);
         }

        // Crear la reserva en la base de datos
        const [fechaInicioStr, fechaFinStr] = fechas.split(" a ");
        const fechaInicio = moment(fechaInicioStr, 'DD/MM/YY');
        const fechaFin = moment(fechaFinStr, 'DD/MM/YY');

        if (!fechaInicio.isValid() || !fechaFin.isValid()) {
            return res.status(400).send("Formato de fecha incorrecto. Debe ser dd/mm/yy");
        }

        const habitacionesIds = Array.isArray(habitaciones)
        ? habitaciones.map(h => h.id)
        : [habitaciones.id];

        const reserva = new Reserva({
            usuario: req.user._id,
            habitaciones: habitacionesIds, // Asume que habitaciones es un array de IDs
            fechaInicio: fechaInicio.toDate(),
            fechaFin: fechaFin.toDate(),
            precioTotal: precioTotal,
            nombre: nombre,
            email: email,
            telefono: telefono,
            transaccionId: pago.transactionId,
            tarjeta: tarjeta,
            vencimiento: vencimiento,
            cvv: cvv,
            titular: titular
        });

        await reserva.save();

        console.log("Datos recibidos en /confirmar-reserva:", {
            reserva: reserva,
        });

        // 4. Enviar un correo electrónico de confirmación al usuario
        // ...

        // 5. Redirigir al usuario a una página de confirmación final
        res.send('Reserva confirmada! Revisa la consola para ver los datos recibidos.');

    } catch (error) {
        console.error('Error al confirmar la reserva:', error);
        res.status(500).send('Error al confirmar la reserva.');
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