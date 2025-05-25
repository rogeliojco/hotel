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
<<<<<<< HEAD
    required: true
  },
  fechaFin: {
    type: Date,
    required: true
  },
  precioTotal: {
    type: Number,
    required: true
=======
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
>>>>>>> 229a026 (Subiendo módulos nuevos del perfil con diseño actualizado)
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
<<<<<<< HEAD
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
=======

  // Datos personales del cliente (en el momento de reservar)
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

  // Información de pago (se recomienda en producción NO guardar esto)
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

>>>>>>> 229a026 (Subiendo módulos nuevos del perfil con diseño actualizado)
