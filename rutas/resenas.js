const express = require('express');
const router = express.Router();
const Resena = require('../models/resena');
const Hotel = require('../models/hotel'); // solo si tienes un modelo Hotel
const { isAuthenticated } = require('../middlewares/auth');

// Mostrar formulario para escribir una nueva reseña
router.get('/nueva', isAuthenticated, async (req, res) => {
  try {
    // Puedes mostrar una lista de hoteles si es necesario:
    const hoteles = await Hotel.find(); // si tienes modelo Hotel
    res.render('resenas/nueva', { hoteles });
  } catch (err) {
    console.error('Error al cargar formulario de reseña:', err);
    res.redirect('/perfil?error=No se pudo cargar el formulario');
  }
});

// Guardar la reseña enviada por el usuario
router.post('/nueva', isAuthenticated, async (req, res) => {
  try {
    const { hotel, comentario, calificacion } = req.body;

    if (!comentario || !calificacion || !hotel) {
      return res.redirect('/resenas/nueva?error=Todos los campos son obligatorios');
    }

    const nuevaResena = new Resena({
      usuario: req.user._id,
      hotel,
      comentario: comentario.trim(),
      calificacion
    });

    await nuevaResena.save();
    res.redirect('/perfil?success=Reseña enviada con éxito');
  } catch (err) {
    console.error('Error al guardar reseña:', err);
    res.redirect('/resenas/nueva?error=No se pudo guardar la reseña');
  }
});

module.exports = router;
