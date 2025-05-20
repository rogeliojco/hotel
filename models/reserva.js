// models/Reserva.js
const mongoose = require('mongoose');

const reservaSchema = new mongoose.Schema({
  ciudad: String,
  fechas: String,
  habitacion: String,
  codigo: String,
  nombre: String,
  email: String,
  telefono: String,
  tarjeta: String,
  vencimiento: String,
  cvv: String,
  titular: String,
  fechaReserva: { type: Date, default: Date.now },
  estado: { type: String, default: 'pendiente' } // o 'confirmada'
});

module.exports = mongoose.model('Reserva', reservaSchema);
