const express = require('express');
const router = express.Router();
const Notificacion = require('../models/notificacion');
const { isAuthenticated } = require('../middlewares/auth');

// Mostrar todas las notificaciones del usuario autenticado
router.get('/notificaciones', isAuthenticated, async (req, res) => {
  try {
    const notificaciones = await Notificacion.find({ usuario: req.user._id }).sort({ fecha: -1 });
    res.render('notificaciones', { notificaciones });
  } catch (error) {
    console.error('Error al cargar notificaciones:', error);
    res.status(500).send('Error al cargar notificaciones');
  }
});

// ✅ Ruta opcional: eliminar una notificación por su ID
router.post('/notificaciones/:id/eliminar', isAuthenticated, async (req, res) => {
  try {
    await Notificacion.deleteOne({ _id: req.params.id, usuario: req.user._id });
    res.redirect('/perfil?success=Notificación eliminada');
  } catch (err) {
    console.error('Error al eliminar notificación:', err);
    res.redirect('/perfil?error=No se pudo eliminar la notificación');
  }
});

// ✅ Ruta opcional: eliminar todas las notificaciones del usuario
router.post('/notificaciones/eliminar-todas', isAuthenticated, async (req, res) => {
  try {
    await Notificacion.deleteMany({ usuario: req.user._id });
    res.redirect('/perfil?success=Todas las notificaciones han sido eliminadas');
  } catch (error) {
    console.error('Error al eliminar todas las notificaciones:', error);
    res.redirect('/perfil?error=No se pudieron eliminar las notificaciones');
  }
});

module.exports = router;

