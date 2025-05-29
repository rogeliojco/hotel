const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const User = require('../models/user');
const perfilController = require('../controllers/perfilController');

// Middleware de autenticación
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
};

// ==============================
// Rutas relacionadas al perfil
// ==============================

// Vista principal del perfil del usuario
router.get('/perfil', isAuthenticated, perfilController.verPerfil);

// Actualización de nombre y/o contraseña
router.post('/actualizar-perfil', isAuthenticated, perfilController.actualizarPerfil);

router.post('/cambiar-avatar', isAuthenticated, upload.single('avatar'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await user.save();
    res.redirect('/perfil?success=Avatar actualizado');
  } catch (error) {
    console.error('Error al subir avatar:', error);
    res.redirect('/perfil?error=No se pudo actualizar el avatar');
  }
});

module.exports = router;