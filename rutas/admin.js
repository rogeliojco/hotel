const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Reserva = require('../models/reserva');
const Habitacion = require('../models/habitacion');
const Hotel = require('../models/soloHotel');
const moment = require('moment');

const { isAuthenticated, isAdmin } = require('../middlewares/auth');

router.get('/', isAdmin, (req, res) => {
  res.render('admin/panel');
});

router.get('/reservas-por-hotel', isAdmin, async (req, res) => {
  try {
    const reservas = await Reserva.find();
    const agrupadas = {};
    reservas.forEach(res => {
      if (!agrupadas[res.ciudad]) {
        agrupadas[res.ciudad] = [];
      }
      agrupadas[res.ciudad].push(res);
    });
    res.render('admin/reservas-por-hotel', { agrupadas });
  } catch (err) {
    console.error('Error al obtener reservas:', err);
    res.status(500).send('Error interno del servidor');
  }
});

router.get('/reportes', isAdmin, async (req, res) => {
  try {
    res.render('admin/reportes', { reporte: null });
  } catch (error) {
    console.error('Error al cargar la vista de reportes:', error);
    res.status(500).send('Error al cargar la vista de reportes');
  }
});

router.get('/reportes/generar', isAdmin, async (req, res) => {
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
      fin = moment(`${anio}-12-31`).endOf('year').toDate();
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
  } catch (error) {
    console.error('Error al generar reporte:', error);
    res.status(500).send('Error interno al generar el reporte.');
  }
});

module.exports = router;
