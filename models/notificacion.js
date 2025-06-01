const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mensaje: { type: String, required: true },
  tipo: {
    type: String,
    enum: ['reserva', 'cancelacion', 'resena', 'avatar', 'password', 'perfil'],
    required: true
  },
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notificacion', notificacionSchema);



