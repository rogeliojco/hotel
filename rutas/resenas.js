const express = require('express');
const router = express.Router();
const Resena = require('../models/resena');
const Notificacion = require('../models/notificacion');
const { isAuthenticated } = require('../middlewares/auth');

router.post('/nueva', isAuthenticated, async (req, res) => {
  try {
    const { titulo, comentario, reservaId } = req.body;

    if (!titulo || !comentario || !reservaId) {
      return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
    }

    const nueva = new Resena({
      usuario: req.user._id,
      reserva: reservaId,
      titulo,
      comentario,
      fecha: new Date()
    });

    await nueva.save();

    // ✅ Crear notificación por reseña
    await Notificacion.create({
      usuario: req.user._id,
      mensaje: `Publicaste una reseña titulada: "${titulo}".`,
      tipo: 'resena'
    });

    res.status(200).json({
      success: true,
      resena: {
        titulo: nueva.titulo,
        comentario: nueva.comentario
      }
    });
  } catch (error) {
    console.error('❌ Error al guardar reseña:', error);
    res.status(500).json({ success: false, message: 'Error interno al guardar reseña' });
  }
});

// ✅ Eliminar reseña (solo si pertenece al usuario)
router.post('/eliminar/:id', isAuthenticated, async (req, res) => {
  try {
    const resena = await Resena.findOneAndDelete({
      _id: req.params.id,
      usuario: req.user._id
    });

    if (!resena) {
      return res.status(404).json({ success: false, message: 'Reseña no encontrada' });
    }

    res.json({ success: true, id: req.params.id });
  } catch (error) {
    console.error('Error al eliminar reseña:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar la reseña' });
  }
});

module.exports = router;

