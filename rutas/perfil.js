const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');

const User = require('../models/user');
const Reserva = require('../models/reserva');
const Resena = require('../models/resena');
const Factura = require('../models/factura');
const Recomendacion = require('../models/recomendacion');
const Notificacion = require('../models/notificacion');

const moment = require('moment');

// Middleware de autenticación
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
};

// ==============================
// Vista principal del perfil del usuario
// ==============================
router.get('/perfil', isAuthenticated, async (req, res) => {
  try {
    const orden = req.query.orden || 'recientes';

    const criteriosOrden = {
      'recientes': { createdAt: -1 },
      'antiguas': { createdAt: 1 },
      'puntuacion-alta': { puntuacion: -1 },
      'puntuacion-baja': { puntuacion: 1 }
    };

    const reservas = await Reserva.find({ usuario: req.user._id })
      .populate({
        path: 'habitaciones',
        populate: { path: 'hotel' }
      })
      .populate('hotel');

    const resenas = await Resena.find({ usuario: req.user._id }).sort(criteriosOrden[orden] || { createdAt: -1 });

    const notificaciones = await Notificacion.find({ usuario: req.user._id }).sort({ fecha: -1 });
    const facturas = await Factura.find({ usuario: req.user._id }).sort({ fecha: -1 });
    const recomendaciones = await Recomendacion.find({ usuario: req.user._id });

    res.render('perfil', {
      user: req.user,
      reservas,
      resenas, // Usar sin tilde
      notificaciones,
      facturas,
      recomendaciones,
      moment,
      success: req.query.success,
      error: req.query.error
    });

  } catch (error) {
    console.error('Error al cargar perfil:', error);
    res.status(500).send('Error al cargar perfil');
  }
});

// ==============================
// Formulario para reservar
// ==============================
router.get('/reservar', isAuthenticated, (req, res) => {
  res.render('reservar', { user: req.user });
});

// ==============================
// Vista para editar perfil
// ==============================
router.get('/editar-perfil', isAuthenticated, (req, res) => {
  res.render('editar-perfil', { user: req.user });
});

// ==============================
// Actualización de nombre y/o contraseña
// ==============================
router.post('/actualizar-perfil', isAuthenticated, async (req, res) => {
  const { nombre, password } = req.body;

  try {
    const user = await User.findById(req.user._id);
    let cambios = [];

    if (nombre && nombre !== user.name) {
      user.name = nombre;
      cambios.push('nombre');
    }

    if (password) {
      user.password = user.encryptPassword(password);
      cambios.push('contraseña');
    }

    await user.save();

    if (cambios.length > 0) {
      await Notificacion.create({
        usuario: req.user._id,
        mensaje: `Modificaste tu ${cambios.join(' y ')} del perfil.`,
        tipo: 'perfil'
      });
    }

    res.redirect('/perfil?success=Perfil actualizado');
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.redirect('/perfil?error=No se pudo actualizar el perfil');
  }
});

// ==============================
// Cambio de avatar
// ==============================
router.post('/cambiar-avatar', isAuthenticated, upload.single('avatar'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    await Notificacion.create({
      usuario: req.user._id,
      mensaje: 'Actualizaste tu foto de perfil.',
      tipo: 'avatar'
    });

    res.redirect('/perfil?success=Avatar actualizado');
  } catch (error) {
    console.error('Error al subir avatar:', error);
    res.redirect('/perfil?error=No se pudo actualizar el avatar');
  }
});

module.exports = router;
