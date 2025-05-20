const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  precio: { type: Number, required: true },
  imagen: String,
  categoria: String,
  stock: Number,
  creadoEn: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Producto', productoSchema);
