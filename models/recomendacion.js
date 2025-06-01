const mongoose = require('mongoose');

const recomendacionSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  nombre: String,
  descripcion: String,
  imagen: String
});

module.exports = mongoose.model('Recomendacion', recomendacionSchema);
