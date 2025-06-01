const express = require('express');
const router = express.Router();
const Reserva = require('../models/reserva');
const Factura = require('../models/factura');
const Notificacion = require('../models/notificacion');
const Habitacion = require('../models/habitacion');
const { isAuthenticated } = require('../middlewares/auth');
const puppeteer = require('puppeteer');
const path = require('path');
const ejs = require('ejs');

// POST /confirmar-reserva
router.post('/confirmar-reserva', isAuthenticated, async (req, res) => {
  try {
    const {
      ciudad, fechas, habitacion,
      nombre, email, telefono,
      tarjeta, vencimiento, cvv, titular
    } = req.body;

    const [inicioStr, finStr] = fechas.split(' a ');
    const fechaInicio = new Date(inicioStr.split('/').reverse().join('-'));
    const fechaFin = new Date(finStr.split('/').reverse().join('-'));

    const habitacionSeleccionada = await Habitacion.findById(habitacion).populate('hotel');
    if (!habitacionSeleccionada) {
      return res.status(404).send('Habitación no encontrada.');
    }

    const precioTotal = habitacionSeleccionada.precioNoche || 1500;

    const nuevaReserva = new Reserva({
      usuario: req.user._id,
      habitaciones: [habitacionSeleccionada._id],
      hotel: habitacionSeleccionada.hotel._id,
      fechaInicio,
      fechaFin,
      precioTotal,
      nombre,
      email,
      telefono,
      tarjeta,
      vencimiento,
      cvv,
      titular,
      estado: 'confirmada'
    });

    await nuevaReserva.save();

// Crear factura con nombre real del hotel
const nuevaFactura = await Factura.create({
  usuario: req.user._id,
  reserva: nuevaReserva._id,
  nombreEstablecimiento: habitacionSeleccionada.hotel.nombre,
  monto: precioTotal
});

console.log('Factura generada:', nuevaFactura);

    await Notificacion.create({
      usuario: req.user._id,
      mensaje: `Tu reserva del ${inicioStr} al ${finStr} fue confirmada.`,
      tipo: 'reserva'
    });



    const reservaConDetalles = await Reserva.findById(nuevaReserva._id)
      .populate('habitaciones')
      .populate('hotel');

    res.render('reserva-confirmada', { nombre, reserva: reservaConDetalles });
  } catch (error) {
    console.error('Error al guardar la reserva:', error);
    res.status(500).send('Error al guardar la reserva.');
  }
});

// GET /reserva/:id
router.get('/reserva/:id', isAuthenticated, async (req, res) => {
  try {
    const reserva = await Reserva.findById(req.params.id)
      .populate('habitaciones')
      .populate('hotel'); // ✅ agregado

    if (!reserva || reserva.usuario.toString() !== req.user._id.toString()) {
      return res.status(404).send('No se encontró la reservación');
    }

    res.render('detalle-reserva', { reserva });
  } catch (error) {
    console.error('Error al buscar la reserva:', error);
    res.status(500).send('Error al cargar los detalles.');
  }
});

// POST /reserva/:id/cancelar
// POST /reserva/:id/cancelar
router.post('/reserva/:id/cancelar', isAuthenticated, async (req, res) => {
  try {
    const reserva = await Reserva.findOne({ _id: req.params.id, usuario: req.user._id })
      .populate('hotel'); // ✅ Asegúrate de poblar hotel

    if (!reserva) return res.status(404).send('Reservación no encontrada.');

    reserva.estado = 'cancelada';
    await reserva.save();

    // ✅ Notificación con el nombre del hotel
    await Notificacion.create({
      usuario: req.user._id,
      mensaje: `Cancelaste tu estancia en ${reserva.hotel?.nombre || 'un hotel'} del ${reserva.fechaInicio.toLocaleDateString('es-MX')} al ${reserva.fechaFin.toLocaleDateString('es-MX')}.`,
      tipo: 'cancelacion'
    });

    res.redirect('/perfil?success=Reservación cancelada correctamente');
  } catch (error) {
    console.error('Error al cancelar la reserva:', error);
    res.redirect('/perfil?error=No se pudo cancelar la reservación');
  }
});


// POST /reserva/:id/eliminar
router.post('/reserva/:id/eliminar', isAuthenticated, async (req, res) => {
  try {
    const reserva = await Reserva.findOneAndDelete({
      _id: req.params.id,
      usuario: req.user._id,
      estado: 'cancelada'
    });

    if (!reserva) return res.redirect('/perfil?error=Reserva no encontrada o no cancelada.');
    res.redirect('/perfil?success=Reserva eliminada correctamente.');
  } catch (err) {
    console.error('Error al eliminar reserva:', err);
    res.redirect('/perfil?error=No se pudo eliminar la reserva.');
  }
});

// GET /historial-canceladas
router.get('/historial-canceladas', isAuthenticated, async (req, res) => {
  try {
    const reservas = await Reserva.find({ usuario: req.user._id, estado: 'cancelada' });
    res.render('historial-canceladas', { reservas });
  } catch (error) {
    console.error('Error al cargar el historial de canceladas:', error);
    res.status(500).send('Error al cargar el historial de canceladas');
  }
});

// GET /reserva/:id/factura
router.get('/reserva/:id/factura', isAuthenticated, async (req, res) => {
  try {
    const reserva = await Reserva.findById(req.params.id)
      .populate('habitaciones')
      .populate('hotel'); // Asegura que también tienes los datos del hotel para el PDF

    if (!reserva || reserva.usuario.toString() !== req.user._id.toString()) {
      return res.status(404).send('Reserva no encontrada');
    }

    const html = await ejs.renderFile(path.join(__dirname, '../views/factura.ejs'), { reserva });

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="factura-${reserva._id}.pdf"`,
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error al generar la factura PDF:', err);
    res.status(500).send('No se pudo generar la factura');
  }
});
// Ruta para generar factura manualmente para la última reserva
router.get('/generar-factura-ultima', isAuthenticated, async (req, res) => {
  try {
    const ultimaReserva = await Reserva.findOne({ usuario: req.user._id })
      .sort({ createdAt: -1 })
      .populate('hotel');

    if (!ultimaReserva) {
      return res.redirect('/perfil?error=No se encontró ninguna reserva para generar factura');
    }

    // Verificar si ya existe factura
    const facturaExistente = await Factura.findOne({ reserva: ultimaReserva._id });
    if (facturaExistente) {
      return res.redirect('/perfil?error=La factura ya fue creada anteriormente');
    }

    await Factura.create({
      usuario: req.user._id,
      reserva: ultimaReserva._id,
      nombreEstablecimiento: ultimaReserva.hotel?.nombre || 'Hotel no especificado',
      monto: ultimaReserva.precioTotal
    });

    res.redirect('/perfil?success=Factura generada exitosamente para la última reserva');
  } catch (error) {
    console.error('Error al generar factura manual:', error);
    res.redirect('/perfil?error=No se pudo generar la factura manual');
  }
});

module.exports = router;
