const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Reserva = require('../models/reserva');
const Habitacion = require('../models/habitacion');
const Hotel = require('../models/soloHotel');
const moment = require('moment');

const { isAuthenticated, isAdmin } = require('../middlewares/auth');

// Ruta para el panel de administración
router.get('/', isAdmin, (req, res) => {
    console.log("Entrando a / (panel de administración)");
    try {
        res.render('admin/panel');
        console.log("Renderizando la vista admin/panel");
    } catch (error) {
        console.error("Error en /:", error);
        res.status(500).send("Error al cargar el panel de administración.");
    }
});

// Ruta para las reservas por hotel
router.get('/reservas-por-hotel', isAdmin, async (req, res) => {
  try {
    const reservas = await Reserva.find()
      .sort({ fechaReserva: -1 })
      .populate('habitaciones') // traer habitaciones completas
      .lean();

    const hotelesMap = {}; // cache local de hoteles
    const agrupadas = {};

    for (const res of reservas) {
      const habitaciones = res.habitaciones || [];
      const nombresHabitaciones = habitaciones.map(h => h?.nombre || 'N/A').join(', ');

      // Obtener nombre del hotel desde la primera habitación (asumimos que todas son del mismo hotel)
      let hotelNombre = 'Hotel desconocido';
      if (habitaciones.length > 0 && habitaciones[0].hotel) {
        const hotelId = habitaciones[0].hotel.toString();
        if (!hotelesMap[hotelId]) {
          const hotel = await Hotel.findById(hotelId).lean();
          hotelesMap[hotelId] = hotel?.nombre || 'Hotel sin nombre';
        }
        hotelNombre = hotelesMap[hotelId];
      }

      const noches = moment(res.fechaFin).diff(moment(res.fechaInicio), 'days');
      const precioNoche = noches > 0 ? (res.precioTotal / noches).toFixed(2) : 'N/A';

      const fila = {
        nombre: res.nombre,
        habitaciones: nombresHabitaciones,
        hotel: hotelNombre,
        noches,
        precioNoche,
        precioTotal: res.precioTotal,
        fechaReserva: moment(res.fechaReserva).format('DD/MM/YYYY')
      };

      if (!agrupadas[hotelNombre]) agrupadas[hotelNombre] = [];
      agrupadas[hotelNombre].push(fila);
    }

    res.render('admin/reservas-por-hotel', { agrupadas });
  } catch (err) {
    console.error('Error al obtener reservas:', err);
    res.status(500).send('Error interno del servidor');
  }
});

// Ruta para la gestión de usuarios del sistema
router.get('/usuarios-sistema', isAdmin, async (req, res) => {
    console.log("Entrando a /usuarios-sistema");
    try {
        const usuarios = await User.find();
        console.log("Usuarios encontrados:", usuarios);
        res.render('admin/usuarios-sistema', { usuarios });
        console.log("Renderizando la vista admin/usuarios-sistema");
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).send('Error al obtener usuarios');
    }
});

// Ruta para añadir una nueva habitación
router.get('/nueva-habitacion', isAdmin, async (req, res) => {
    console.log("Entrando a /nueva-habitacion");
    try {
        // 1. Obtener todos los hoteles
        const hoteles = await Hotel.find();
        console.log("Hoteles encontrados:", hoteles);

        // 2. Agrupar los hoteles por estado
        const hotelesPorEstado = {};
        hoteles.forEach(hotel => {
            if (!hotelesPorEstado[hotel.estado]) {
                hotelesPorEstado[hotel.estado] = [];
            }
            hotelesPorEstado[hotel.estado].push(hotel);
        });
        console.log("Hoteles agrupados por estado:", hotelesPorEstado);

        // 3. Renderizar la vista, pasando los hoteles agrupados por estado
        res.render('admin/nueva-habitacion', { hotelesPorEstado: hotelesPorEstado });
        console.log("Renderizando la vista admin/nueva-habitacion con hotelesPorEstado");
    } catch (error) {
        console.error('Error al cargar la vista de nueva habitación:', error);
        res.status(500).send('Error al cargar la vista de nueva habitación');
    }
});

// Ruta para añadir un nuevo hotel
router.get('/nuevo-hotel', isAdmin, (req, res) => {
    console.log("Entrando a /nuevo-hotel");
    try {
        res.render('admin/nuevo-hotel');
        console.log("Renderizando la vista admin/nuevo-hotel");
    } catch (error) {
        console.error('Error al cargar la vista de nuevo hotel:', error);
        res.status(500).send('Error al cargar la vista de nuevo hotel');
    }
});

// Ruta para los reportes
router.get('/reportes', isAdmin, async (req, res) => {
    console.log("Entrando a /reportes");
    try {
        res.render('admin/reportes', { reporte: null });
        console.log("Renderizando la vista admin/reportes");
    } catch (error) {
        console.error('Error al cargar la vista de reportes:', error);
        res.status(500).send('Error al cargar la vista de reportes');
    }
});

// Ruta para generar los reportes
router.get('/reportes/generar', isAdmin, async (req, res) => {
    console.log("Entrando a /reportes/generar");
    const { tipo, modo, mes, anio } = req.query;
    let reporte = null;
    try {
        let inicio, fin;
        if (modo === 'mes') {
            if (!mes) return res.render('admin/reportes', { reporte: { error: 'Debes seleccionar un mes' } });
            inicio = moment(mes).startOf('month').toDate();
            fin = moment(mes).endOf('month').toDate();
        } else if (modo === 'anio') {
            if (!anio) return res.render('admin/reportes', { reporte: { error: 'Debes ingresar un año válido' } });
            inicio = moment(`${anio}-01-01`).startOf('year').toDate();
            fin = moment(`${anio}-12-31`).endOf('month').toDate();
        } else {
            return res.render('admin/reportes', { reporte: { error: 'Modo de periodo no válido' } });
        }

        if (tipo === 'ingresos') {
            const ingresos = await Reserva.aggregate([
                {
                    $match: {
                        fechaInicio: { $gte: inicio },
                        fechaFin: { $lte: fin }
                    }
                },
                {
                    $lookup: {
                        from: "habitacions",
                        localField: "habitaciones",
                        foreignField: "_id",
                        as: "habitaciones"
                    }
                },
                { $unwind: "$habitaciones" },
                {
                    $lookup: {
                        from: "hotels",
                        localField: "habitaciones.hotel",
                        foreignField: "_id",
                        as: "hotel"
                    }
                },
                { $unwind: "$hotel" },
                {
                    $group: {
                        _id: "$hotel.nombre",
                        totalPorHotel: { $sum: "$precioTotal" }
                    }
                },
                { $sort: { totalPorHotel: -1 } }
            ]);

            const total = ingresos.reduce((acc, h) => acc + h.totalPorHotel, 0);

            reporte = {
                tipo: 'Ingresos',
                periodo: modo === 'mes' ? moment(inicio).format('MMMM YYYY') : anio,
                total: `$${total.toFixed(2)} MXN`,
                desglose: ingresos.map(i => ({
                    hotel: i._id,
                    total: `$${i.totalPorHotel.toFixed(2)} MXN`
                }))
            };
        } else if (tipo === 'habitaciones') {
            const habitaciones = await Habitacion.aggregate([
                { $unwind: "$reservas" },
                {
                    $match: {
                        "reservas.fechaInicio": { $gte: inicio },
                        "reservas.fechaFin": { $lte: fin }
                    }
                },
                {
                    $lookup: {
                        from: "hotels",
                        localField: "hotel",
                        foreignField: "_id",
                        as: "hotel"
                    }
                },
                { $unwind: "$hotel" },
                {
                    $group: {
                        _id: {
                            hotel: "$hotel.nombre",
                            habitacion: "$nombre"
                        },
                        cantidad: { $sum: 1 }
                    }
                },
                { $sort: { cantidad: -1 } }
            ]);

            reporte = habitaciones.map(h => ({
                hotel: h._id.hotel,
                habitacion: h._id.habitacion,
                cantidad: h.cantidad
            }));
        } else if (tipo === 'clientes') {
            const clientes = await Reserva.aggregate([
                {
                    $match: {
                        fechaInicio: { $gte: inicio },
                        fechaFin: { $lte: fin }
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "usuario",
                        foreignField: "_id",
                        as: "usuario"
                    }
                },
                { $unwind: "$usuario" },
                {
                    $lookup: {
                        from: "habitacions",
                        localField: "habitaciones",
                        foreignField: "_id",
                        as: "habitaciones"
                    }
                },
                { $unwind: "$habitaciones" },
                {
                    $lookup: {
                        from: "hotels",
                        localField: "habitaciones.hotel",
                        foreignField: "_id",
                        as: "hotel"
                    }
                },
                { $unwind: "$hotel" },
                {
                    $group: {
                        _id: {
                            hotel: "$hotel.nombre",
                            clienteId: "$usuario._id"
                        },
                        hotel: { $first: "$hotel.nombre" },
                        name: { $first: "$usuario.name" },
                        email: { $first: "$usuario.email" },
                        cantidad: { $sum: 1 }
                    }
                },
                { $sort: { cantidad: -1 } }
            ]);

            reporte = clientes.map(c => ({
                hotel: c.hotel,
                cliente: c.name ? c.name : `[sin nombre] (${c.email})`,
                email: c.email,
                cantidad: c.cantidad
            }));
        }

        res.render('admin/reportes', { reporte });
        console.log("Renderizando la vista admin/reportes con reporte:", reporte);

    } catch (error) {
        console.error('Error al generar reporte:', error);
        res.status(500).send('Error interno al generar el reporte.');
    }
});

// Ruta POST para añadir un nuevo hotel
router.post('/nuevo-hotel', isAdmin, async (req, res) => {
    console.log("Entrando a POST /nuevo-hotel");
    console.log("Datos del formulario:", req.body);

    try {
        // Asegúrate de transformar los datos anidados
        const datosHotel = {
            nombre: req.body.nombre,
            descripcionCorta: req.body.descripcionCorta,
            zona: req.body.zona,
            estaCercaDe: {
                tipo: req.body['estaCercaDe.tipo'],
                distancia: req.body['estaCercaDe.distancia']
            },
            estado: req.body.estado,
            calificacionGeneral: req.body.calificacionGeneral,
            numeroComentarios: req.body.numeroComentarios,
            impuestosCargos: req.body.impuestosCargos,
            ubicacion: req.body.ubicacion,
            urlImagen: req.body.urlImagen || null,
            aceptaMascotas: req.body.aceptaMascotas === 'on',
            horaCheckIn: req.body.horaCheckIn,
            horaCheckOut: req.body.horaCheckOut,
            latitud: req.body.latitud,
            longitud: req.body.longitud,
            direccion: {
                calle: req.body.calle,
                numero: req.body.numero,
                codigoPostal: req.body.codigoPostal
            },
            contacto: {
                telefono: req.body.telefono,
                email: req.body.email
            },
            servicios: Array.isArray(req.body.servicios) ? req.body.servicios : [req.body.servicios]
        };

        const nuevoHotel = new Hotel(datosHotel);
        await nuevoHotel.save();

        console.log("Hotel guardado correctamente:", nuevoHotel);
        res.redirect('/admin'); // Redirige a donde necesites
    } catch (error) {
        console.error("Error al guardar el nuevo hotel:", error);
        res.status(500).send("Error al guardar el nuevo hotel.");
    }
});

// Ruta POST para añadir una nueva habitación
router.post('/nueva-habitacion', isAdmin, async (req, res) => {
    console.log("Entrando a POST /nueva-habitacion");
    try {
        // 1. Obtener los datos del formulario
        const { hotel, nombre, capacidad, descripcion, precioNoche, imagenes } = req.body;  // Cambié 'precio' a 'precioNoche'
        console.log("Datos del formulario:", req.body);

        // 2. Crear una nueva habitación
        const nuevaHabitacion = new Habitacion({
            hotel: hotel,
            nombre: nombre,
            capacidad: capacidad,
            descripcion: descripcion,
            precioNoche: Number(precioNoche),  // Usa precioNoche y conviértelo a número
            imagenes: imagenes.split('\n').map(url => url.trim()).filter(url => url !== ''), // Convierte las imágenes en un array
            detalleHabitacion: {  // Asigna cada propiedad individualmente
                aireAcondicionado: req.body['detalleHabitacion.aireAcondicionado'] === 'true', // Convierte a booleano
                camas: Number(req.body['detalleHabitacion.camas']), // Convierte a número
                televisiones: Number(req.body['detalleHabitacion.televisiones']), // Convierte a número
                banos: Number(req.body['detalleHabitacion.banos']), // Convierte a número
                alberca: req.body['detalleHabitacion.alberca'] === 'true', // Convierte a booleano
                jacuzzi: req.body['detalleHabitacion.jacuzzi'] === 'true', // Convierte a booleano
                wifi: req.body['detalleHabitacion.wifi'] === 'true', // Convierte a booleano
                balcon: req.body['detalleHabitacion.balcon'] === 'true', // Convierte a booleano
                cocina: req.body['detalleHabitacion.cocina'] === 'true', // Convierte a booleano
                minibar: req.body['detalleHabitacion.minibar'] === 'true'  // Convierte a booleano
            }
        });

        // 3. Guardar la nueva habitación en la base de datos
        await nuevaHabitacion.save();
        console.log("Nueva habitación guardada:", nuevaHabitacion);

        // 4. Redirigir al usuario a la página de administración (o a donde quieras)
        res.redirect('/admin/lista-habitaciones');
        console.log("Redirigiendo a habitaciones");

    } catch (error) {
        console.error('Error al guardar la nueva habitación:', error);
        res.status(500).send('Error al guardar la nueva habitación.');
    }
});

// LISTAR HABITACIONES
router.get('/lista-habitaciones', isAdmin, async (req, res) => {
  try {
    const habitaciones = await Habitacion.find()
      .populate('hotel') // Para mostrar nombre del hotel
      .lean();

    res.render('admin/listar-habitaciones', { habitaciones });
  } catch (error) {
    console.error('Error al listar habitaciones:', error);
    res.status(500).send('Error al listar habitaciones');
  }
});

router.get('/editar-habitacion/:id', isAdmin, async (req, res) => {
  try {
    const habitacion = await Habitacion.findById(req.params.id).lean();
    const hoteles = await Hotel.find().lean();

    // Agrupar hoteles por estado (igual que en nueva-habitacion)
    const hotelesPorEstado = {};
    hoteles.forEach(hotel => {
      if (!hotelesPorEstado[hotel.estado]) {
        hotelesPorEstado[hotel.estado] = [];
      }
      hotelesPorEstado[hotel.estado].push(hotel);
    });

    res.render('admin/editar-habitacion', { hotelesPorEstado, habitacion });
  } catch (error) {
    console.error('Error al cargar habitación para editar:', error);
    res.status(500).send('Error al cargar habitación');
  }
});

router.post('/editar-habitacion/:id', isAdmin, async (req, res) => {
  try {
    const { hotel, nombre, capacidad, descripcion, precioNoche, imagenes } = req.body;

    const actualizada = {
      hotel,
      nombre,
      capacidad,
      descripcion,
      precioNoche: Number(precioNoche),
      imagenes: imagenes.split('\n').map(url => url.trim()).filter(url => url !== ''),
      detalleHabitacion: {
        aireAcondicionado: req.body['detalleHabitacion.aireAcondicionado'] === 'true',
        camas: Number(req.body['detalleHabitacion.camas']),
        televisiones: Number(req.body['detalleHabitacion.televisiones']),
        banos: Number(req.body['detalleHabitacion.banos']),
        alberca: req.body['detalleHabitacion.alberca'] === 'true',
        jacuzzi: req.body['detalleHabitacion.jacuzzi'] === 'true',
        wifi: req.body['detalleHabitacion.wifi'] === 'true',
        balcon: req.body['detalleHabitacion.balcon'] === 'true',
        cocina: req.body['detalleHabitacion.cocina'] === 'true',
        minibar: req.body['detalleHabitacion.minibar'] === 'true'
      }
    };

    await Habitacion.findByIdAndUpdate(req.params.id, actualizada);
    res.redirect('/admin/lista-habitaciones');
  } catch (error) {
    console.error('Error al editar habitación:', error);
    res.status(500).send('Error al editar habitación');
  }
});

router.post('/eliminar-habitacion/:id', isAdmin, async (req, res) => {
  try {
    await Habitacion.findByIdAndDelete(req.params.id);
    res.redirect('/admin/lista-habitaciones');
  } catch (error) {
    console.error('Error al eliminar habitación:', error);
    res.status(500).send('Error al eliminar habitación');
  }
});





module.exports = router;