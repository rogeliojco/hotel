const express = require('express');
const router = express.Router();
const Reserva = require('../models/reserva');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');

// Mostrar formulario para nueva reserva
router.get('/reservar', isAuthenticated, (req, res) => {
  res.render('reserva', {
    user: req.user,
    ciudad: '',
    fechas: '',
    habitacion: '',
    codigo: ''
  });
});

// Confirmar y guardar nueva reserva
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
      usuario: req.user._id, // Asociar al usuario logueado
      estado: 'pendiente',
      fechaReserva: new Date() // opcional
    });

    await nuevaReserva.save();
    res.render('reserva-confirmada', { nombre });
  } catch (error) {
    console.error('Error al guardar la reserva:', error);
    res.status(500).send('Error al guardar la reserva.');
  }
});

// Ver detalles de una reservación
router.get('/reserva/:id', isAuthenticated, async (req, res) => {
  try {
    const reserva = await Reserva.findById(req.params.id);
    if (!reserva || reserva.usuario.toString() !== req.user._id.toString()) {
      return res.status(404).send('No se encontró la reservación');
    }
    res.render('detalle-reserva', { reserva });
  } catch (error) {
    console.error('Error al buscar la reserva:', error);
    res.status(500).send('Error al cargar los detalles.');
  }
});

// Cancelar una reservación
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

    res.redirect('/perfil?success=Reservación cancelada correctamente');
  } catch (error) {
    console.error('Error al cancelar la reserva:', error);
    res.redirect('/perfil?error=No se pudo cancelar la reservación');
  }
});

// Historial de reservaciones canceladas
router.get('/historial-canceladas', isAuthenticated, async (req, res) => {
  try {
    const reservas = await Reserva.find({
      usuario: req.user._id,
      estado: 'cancelada'
    }).sort({ fechaReserva: -1 });

    res.render('historial-canceladas', { reservas });
  } catch (error) {
    console.error('Error al cargar el historial:', error);
    res.status(500).send('Error al cargar el historial.');
  }
});

module.exports = router;
