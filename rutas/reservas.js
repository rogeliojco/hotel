const express = require('express');
const router = express.Router();
const Reserva = require('../models/reserva');

router.post('/confirmar-reserva', async (req, res) => {
  console.log('Datos recibidos del formulario:', req.body);
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
      estado: 'pendiente'
    });

    await nuevaReserva.save();

    res.render('reserva-confirmada', { nombre });
  } catch (error) {
    console.error('Error al guardar la reserva:', error);
    res.status(500).send('Error al guardar la reserva.');
  }
});

module.exports = router;