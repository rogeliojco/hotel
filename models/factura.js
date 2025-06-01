// models/factura.js
const mongoose = require('mongoose');

const facturaSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reserva: { type: mongoose.Schema.Types.ObjectId, ref: 'Reserva', required: true },
  nombreEstablecimiento: String,
  monto: Number,
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Factura', facturaSchema);
