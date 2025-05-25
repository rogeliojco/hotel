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
    console.log("Entrando a /reservas-por-hotel");
    try {
        const reservas = await Reserva.find();
        console.log("Reservas encontradas:", reservas);
        const agrupadas = {};
        reservas.forEach(res => {
            if (!agrupadas[res.ciudad]) {
                agrupadas[res.ciudad] = [];
            }
            agrupadas[res.ciudad].push(res);
        });
        console.log("Reservas agrupadas:", agrupadas);
        res.render('admin/reservas-por-hotel', { agrupadas });
        console.log("Renderizando la vista admin/reservas-por-hotel");
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

// Ruta POST para añadir una nueva habitación
router.post('/nueva-habitacion', isAdmin, async (req, res) => {
    console.log("Entrando a POST /nueva-habitacion");
    try {
        // 1. Obtener los datos del formulario
        const { hotel, nombre, tipo, descripcion, precio, imagenes, detalleHabitacion } = req.body;
        console.log("Datos del formulario:", req.body);

        // 2. Crear una nueva habitación
        const nuevaHabitacion = new Habitacion({
            hotel: hotel,
            nombre: nombre,
            tipo: tipo,
            descripcion: descripcion,
            precio: precio,
            imagenes: imagenes.split('\n').map(url => url.trim()).filter(url => url !== ''), // Convierte las imágenes en un array
            detalleHabitacion: detalleHabitacion
        });

        // 3. Guardar la nueva habitación en la base de datos
        await nuevaHabitacion.save();
        console.log("Nueva habitación guardada:", nuevaHabitacion);

        // 4. Redirigir al usuario a la página de administración (o a donde quieras)
        res.redirect('/admin');
        console.log("Redirigiendo a /admin");

    } catch (error) {
        console.error('Error al guardar la nueva habitación:', error);
        res.status(500).send('Error al guardar la nueva habitación.');
    }
});

module.exports = router;