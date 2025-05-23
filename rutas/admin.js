const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Reserva = require('../models/reserva');
const Habitacion = require('../models/habitacion');
const Hotel = require('../models/soloHotel');
const Habitacion = require('../models/habitacion');



const { isAuthenticated, isAdmin } = require('../middlewares/auth');



router.get('/', isAdmin, (req, res) => {
  res.render('admin/panel');
});

router.get('/reservas-por-hotel', isAdmin, async (req, res) => {
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



router.post('/nueva-habitacion', async (req, res) => {
  try {
    const { nombre, tipo, descripcion, precio, imagenes, hotel } = req.body;

    const imagenesArray = typeof imagenes === 'string'
      ? imagenes
          .split('\n')
          .map(url => url.trim())
          .filter(url => url.length > 0)
      : [];

    const nuevaHabitacion = new Habitacion({
      nombre,
      tipo,
      descripcion,
      precioNoche: precio,
      imagenes: imagenesArray,
      hotel
    });

    await nuevaHabitacion.save();
    res.redirect('/admin');
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).send('El nombre de la habitación ya está registrado en este hotel.');
    } else {
      console.error('Error al guardar habitación:', error);
      res.status(500).send('Error al guardar habitación');
    }
  }
});



router.get('/nueva-habitacion', async (req, res) => {
  try {
    const hoteles = await Hotel.find().select('_id nombre estado');

    // Agrupar por estado
    const hotelesPorEstado = {};
    hoteles.forEach(hotel => {
      if (!hotelesPorEstado[hotel.estado]) {
        hotelesPorEstado[hotel.estado] = [];
      }
      hotelesPorEstado[hotel.estado].push(hotel);
    });

    res.render('admin/nueva-habitacion', { hotelesPorEstado });
  } catch (error) {
    console.error('Error al cargar hoteles:', error);
    res.status(500).send('Error al cargar hoteles');
  }
});


router.get('/', isAuthenticated, (req, res) => {
  res.render('admin/panel');
});

router.get('/usuarios-sistema', isAdmin, async (req, res) => {
  try {
    const usuarios = await User.find();
    res.render('admin/usuarios-sistema', { usuarios });
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).send('Error interno del servidor');
  }
});

router.put('/usuarios-sistema/:id/rol', isAdmin, async (req, res) => {
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



router.get('/nuevo-hotel', (req, res) => {
  res.render('admin/nuevo-hotel'); 
});

// (Opcional) redirigir /nuevo al formulario
router.get('/nuevo', (req, res) => {
  res.redirect('admin/nuevo-hotel'); 
});

// Procesar formulario enviado desde /FormularioHotel (action="/hoteles/nuevo")
// POST /nuevo
router.post('/nuevo-hotel', async (req, res) => {
  try {
    const nuevoHotel = new Hotel({
      nombre: req.body.nombre,
      descripcionCorta: req.body.descripcionCorta,
      zona: req.body.zona,
      distanciaCentro: req.body.distanciaCentro,
      estaCercaDe: {
        tipo: req.body['estaCercaDe.tipo'],
        distancia: req.body['estaCercaDe.distancia']
      },
      estado: req.body.estado,
      calificacionGeneral: req.body.calificacionGeneral,
      numeroComentarios: req.body.numeroComentarios,
      impuestosCargos: req.body.impuestosCargos,
      ubicacion: req.body.ubicacion,
      urlImagen: req.body.urlImagen,
      aceptaMascotas: req.body.aceptaMascotas === 'on',
      horaCheckIn: req.body.horaCheckIn,
      horaCheckOut: req.body.horaCheckOut,
      latitud: req.body.latitud,
      longitud: req.body.longitud,
      calle: req.body.calle,
      numero: req.body.numero,
      codigoPostal: req.body.codigoPostal,
      telefono: req.body.telefono,
      email: req.body.email,
      servicios: Array.isArray(req.body.servicios)
        ? req.body.servicios
        : req.body.servicios
        ? [req.body.servicios]
        : []
    });

    await nuevoHotel.save();
    res.render('admin/nuevo-hotel', { mensajeExito: '✅ ¡El hotel se registró correctamente!' });
  } catch (err) {
    res.status(500).send('Error al guardar el hotel: ' + err.message);
  }
});




module.exports = router;
