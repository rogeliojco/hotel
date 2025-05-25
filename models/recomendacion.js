const mongoose = require('mongoose');

const recomendacionSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la recomendación es obligatorio'],
    trim: true
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true
  },
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel', // Si no tienes modelo Hotel, puedes usar type: String
    default: null
  },
  imagen: {
    type: String,
    default: '/images/recomendacion-default.jpg'
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Recomendacion', recomendacionSchema);
