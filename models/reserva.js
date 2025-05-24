const mongoose = require('mongoose');

const reservaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  habitaciones: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habitacion',
    required: true
  }],
  fechaInicio: {
    type: Date,
    required: true
  },
  fechaFin: {
    type: Date,
    required: true
  },
  precioTotal: {
    type: Number,
    required: true
  },
  fechaReserva: {
    type: Date,
    default: Date.now
  },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmada', 'cancelada', 'completada'],
    default: 'pendiente'
  },
  nombre: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  telefono: {
    type: String,
    required: true
  },
  tarjeta: {
    type: String,
    required: true
  },
  vencimiento: {
    type: String,
    required: true
  },
  cvv: {
    type: String,
    required: true
  },
  titular: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Reserva', reservaSchema);