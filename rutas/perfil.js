const express = require('express');
const router = express.Router();
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

// Futuras rutas posibles:
// router.post('/cambiar-avatar', isAuthenticated, perfilController.cambiarAvatar);
// router.post('/actualizar-email', isAuthenticated, perfilController.actualizarEmail);

module.exports = router;

