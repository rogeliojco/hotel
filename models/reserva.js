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
    required: [true, 'La fecha de inicio es obligatoria']
  },
  fechaFin: {
    type: Date,
    required: [true, 'La fecha de salida es obligatoria'],
    validate: {
      validator: function (value) {
        return this.fechaInicio < value;
      },
      message: 'La fecha de salida debe ser posterior a la fecha de inicio'
    }
  },
  precioTotal: {
    type: Number,
    required: [true, 'El precio total es obligatorio'],
    min: [0, 'El precio no puede ser negativo']
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

  // Datos personales del cliente al momento de reservar
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/.+@.+\..+/, 'Correo electrónico inválido']
  },
  telefono: {
    type: String,
    required: true,
    trim: true
  },

  // Información de pago (no recomendado guardar en producción real)
  tarjeta: {
    type: String,
    required: true,
    trim: true
  },
  vencimiento: {
    type: String,
    required: true,
    trim: true
  },
  cvv: {
    type: String,
    required: true,
    trim: true
  },
  titular: {
    type: String,
    required: true,
    trim: true
  }
});

module.exports = mongoose.model('Reserva', reservaSchema);
