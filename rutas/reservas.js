const express = require('express');
const router = express.Router();
const Reserva = require('../models/reserva'); // asegúrate que la ruta al modelo sea correcta

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
      estado: 'pendiente' // se puede cambiar a 'confirmada' si se desea guardar como confirmada
    });

    await nuevaReserva.save();

    res.render('reserva-confirmada', { nombre }); // o redirigir a otra página de éxito
  } catch (error) {
    console.error('Error al guardar la reserva:', error);
    res.status(500).send('Error al guardar la reserva.');
  }
});

module.exports = router;