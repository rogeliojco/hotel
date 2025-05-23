const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Reserva = require('../models/reserva');


function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}


router.get('/', isAuthenticated, (req, res) => {
  res.render('admin/panel');
});

router.get('/reservas-por-hotel', isAuthenticated, async (req, res) => {
  try {
    const reservas = await Reserva.find();

    // Agrupar por ciudad
    const agrupadas = {};
    reservas.forEach(res => {
      if (!agrupadas[res.ciudad]) {
        agrupadas[res.ciudad] = [];
      }
      agrupadas[res.ciudad].push(res);
    });

    res.render('admin/reservas-por-hotel', { agrupadas });
  } catch (err) {
    console.error('Error al obtener reservas:', err);
    res.status(500).send('Error interno del servidor');
  }
});


router.get('/usuarios-sistema', isAuthenticated, async (req, res) => {
  try {
    const usuarios = await User.find();
    res.render('admin/usuarios-sistema', { usuarios });
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).send('Error interno del servidor');
  }
});

router.put('/usuarios-sistema/:id/rol', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;

    if (!['cliente', 'empleado', 'admin'].includes(rol)) {
      return res.status(400).json({ error: 'Rol no válido' });
    }

    const resultado = await User.findByIdAndUpdate(id, { rol });

    if (!resultado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Rol actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});



module.exports = router;
