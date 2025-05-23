const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcionCorta: String,
  zona: { type: String, required: true },
  distanciaCentro: String,
  estaCercaDe: {
    tipo: {
      type: String,
      enum: ['playa', 'centro', 'malecon', 'otro'],
      required: true
    },
    distancia: String
  },
  estado: { type: String, required: true },
  calificacionGeneral: { type: Number, min: 0, max: 10 },
  numeroComentarios: { type: Number, min: 0 },
  impuestosCargos: Number,
  ubicacion: Number,
  urlImagen: String,
  aceptaMascotas: Boolean,
  horaCheckIn: String,
  horaCheckOut: String,
  latitud: Number,
  longitud: Number,
  calle: String,
  numero: String,
  codigoPostal: String,
  telefono: String,
  email: String,
  servicios: {
    type: [String],
    enum: ['piscina', 'wifi', 'desayuno', 'estacionamiento', 'spa', 'gimnasio', 'otros']
  }
});

hotelSchema.index({ zona: 1 });
hotelSchema.index({ estado: 1 });

module.exports = mongoose.model('Hotel', hotelSchema);
