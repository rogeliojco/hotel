const express = require('express');
const router = express.Router();
const Notificacion = require('../models/notificacion');

// Ruta temporal para insertar notificaciones de prueba
router.get('/crear-notificacion-prueba', async (req, res) => {
  try {
    const usuarioId = '6832ee5c7da8812acdb7db36'; // Tu ID de usuario real

    const notificaciones = [
      {
        mensaje: 'Tu reserva en Mazatlán ha sido confirmada.',
        tipo: 'confirmacion'
      },
      {
        mensaje: 'Gracias por dejar tu reseña en Hotel Azul.',
        tipo: 'reseña'
      },
      {
        mensaje: 'Cancelaste tu estancia en Casa Bonita.',
        tipo: 'cancelacion'
      }
    ];

    for (const noti of notificaciones) {
      await Notificacion.create({
        usuario: usuarioId,
        mensaje: noti.mensaje,
        tipo: noti.tipo
      });
    }

    res.send('✅ Notificaciones de prueba insertadas.');
  } catch (error) {
    console.error('Error al insertar notificaciones:', error);
    res.status(500).send('❌ Error al insertar notificaciones.');
  }
});

module.exports = router;


