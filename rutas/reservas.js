const express = require('express');
const router = express.Router();
const Reserva = require('../models/reserva');
const Notificacion = require('../models/notificacion'); // nuevo modelo
const { isAuthenticated, isAdmin } = require('../middlewares/auth');

// Crear nueva reserva y generar notificación
router.post('/confirmar-reserva', isAuthenticated, async (req, res) => {
  try {
    const {
      ciudad, fechas, habitacion, codigo,
      nombre, email, telefono,
      tarjeta, vencimiento, cvv, titular
    } = req.body;

    const nuevaReserva = new Reserva({
      ciudad,
      fechas,
      habitacion,
      codigo,
      nombre,
      email,
      telefono,
      tarjeta,
      vencimiento,
      cvv,
      titular,
      usuario: req.user._id,
      estado: 'pendiente'
    });

    await nuevaReserva.save();

    // Notificación de confirmación
    await Notificacion.create({
      usuario: req.user._id,
      mensaje: `Tu reserva en ${ciudad} ha sido confirmada.`,
      tipo: 'reserva'
    });

    res.render('reserva-confirmada', { nombre });
  } catch (error) {
    console.error('Error al guardar la reserva:', error);
    res.status(500).send('Error al guardar la reserva.');
  }
});

// Ver detalles de una reservación
router.get('/reserva/:id', isAuthenticated, async (req, res) => {
  try {
    const reserva = await Reserva.findOne({
      _id: req.params.id,
      usuario: req.user._id
    });

    if (!reserva) {
      return res.status(404).send('Reservación no encontrada.');
    }

    res.render('detalle-reserva', { reserva });
  } catch (error) {
    console.error('Error al buscar la reserva:', error);
    res.status(500).send('Error al cargar los detalles.');
  }
});

// Cancelar una reservación y notificar
router.post('/reserva/:id/cancelar', isAuthenticated, async (req, res) => {
  try {
    const reserva = await Reserva.findOne({
      _id: req.params.id,
      usuario: req.user._id
    });

    if (!reserva) {
      return res.status(404).send('Reservación no encontrada.');
    }

    reserva.estado = 'cancelada';
    await reserva.save();

    // Notificación de cancelación
    await Notificacion.create({
      usuario: req.user._id,
      mensaje: `Cancelaste tu estancia en ${reserva.ciudad}.`,
      tipo: 'cancelacion'
    });

    res.redirect('/perfil?success=Reservación cancelada correctamente');
  } catch (error) {
    console.error('Error al cancelar la reserva:', error);
    res.redirect('/perfil?error=No se pudo cancelar la reservación');
  }
});

// Historial de reservaciones canceladas (vista simple)
router.get('/historial', isAuthenticated, async (req, res) => {
  try {
    const reservasCanceladas = await Reserva.find({
      usuario: req.user._id,
      estado: 'cancelada'
    }).sort({ fechaReserva: -1 });

    res.render('historial-canceladas', { reservas: reservasCanceladas });
  } catch (error) {
    console.error('Error al cargar el historial:', error);
    res.status(500).send('Error al cargar el historial.');
  }
});

// Vista detallada de una reserva (duplicada, puedes eliminar esta si ya está arriba)
router.get('/reserva/:id', isAuthenticated, async (req, res) => {
  try {
    const reserva = await Reserva.findById(req.params.id);
    if (!reserva || reserva.usuario.toString() !== req.user._id.toString()) {
      return res.status(404).send('No se encontró la reservación');
    }
    res.render('detalle-reserva', { reserva });
  } catch (error) {
    res.status(500).send('Error al cargar los detalles');
  }
});

// Vista alternativa del historial de canceladas (puedes dejar solo uno de los dos endpoints)
router.get('/historial-canceladas', isAuthenticated, async (req, res) => {
  try {
    const reservas = await Reserva.find({
      usuario: req.user._id,
      estado: 'cancelada'
    });
    res.render('historial-canceladas', { reservas });
  } catch (error) {
    res.status(500).send('Error al cargar el historial de canceladas');
  }
});

module.exports = router;
