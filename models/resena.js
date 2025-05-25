const mongoose = require('mongoose');

const resenaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es obligatorio']
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: [true, 'El hotel es obligatorio']
  },
  comentario: {
    type: String,
    required: [true, 'El comentario no puede estar vacío'],
    trim: true,
    minlength: [5, 'El comentario debe tener al menos 5 caracteres'],
    maxlength: [1000, 'El comentario no puede exceder 1000 caracteres']
  },
  calificacion: {
    type: Number,
    required: [true, 'La calificación es obligatoria'],
    min: [1, 'La calificación mínima es 1'],
    max: [5, 'La calificación máxima es 5']
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  estado: {
    type: String,
    enum: ['aprobada', 'pendiente', 'rechazada'],
    default: 'aprobada'
  }
});

module.exports = mongoose.model('Resena', resenaSchema);
