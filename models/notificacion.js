const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificacionSchema = new Schema({
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mensaje: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['confirmacion', 'reseña', 'cancelacion'],
    default: 'confirmacion'
  },
  leida: {
    type: Boolean,
    default: false
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notificacion', notificacionSchema);


