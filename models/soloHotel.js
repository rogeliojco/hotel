const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del hotel es obligatorio'],
    trim: true
  },
  descripcionCorta: {
    type: String,
    trim: true
  },
  zona: {
    type: String,
    required: [true, 'La zona es obligatoria'],
    trim: true
  },
  distanciaCentro: {
    type: String,
    trim: true
  },
  estaCercaDe: {
    tipo: {
      type: String,
      enum: ['playa', 'centro', 'malecon', 'otro'],
      required: [true, 'Se requiere el tipo de cercanía']
    },
    distancia: String
  },
  estado: {
    type: String,
    required: [true, 'El estado es obligatorio'],
    trim: true
  },
  habitacionesDisponibles: {
    unaPersona: { type: Number, default: 0, min: 0 },
    dosPersonas: { type: Number, default: 0, min: 0 },
    cuatroPersonas: { type: Number, default: 0, min: 0 },
    seisPersonas: { type: Number, default: 0, min: 0 }
  },
  detallesHabitacion: String,
  calificacionGeneral: {
    type: Number,
    min: 0,
    max: 10
  },
  numeroComentarios: {
    type: Number,
    min: 0,
    default: 0
  },
  preciosNoche: {
    unaPersona: { type: Number, min: 0, max: 10000 },
    dosPersonas: { type: Number, min: 0, max: 15000 },
    cuatroPersonas: { type: Number, min: 0, max: 20000 },
    seisPersonas: { type: Number, min: 0, max: 25000 }
  },
  impuestosCargos: {
    type: Number,
    min: 0,
    default: 0
  },
  ubicacion: {
    latitud: Number,
    longitud: Number,
    calle: String,
    numero: String,
    codigoPostal: String
  },
  urlImagen: {
    type: String,
    trim: true
  },
  aceptaMascotas: {
    type: Boolean,
    default: false
  },
  horaCheckIn: String,
  horaCheckOut: String,
  contacto: {
    telefono: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, 'Email inválido']
    }
  },
  servicios: {
    type: [String],
    enum: ['piscina', 'wifi', 'desayuno', 'estacionamiento', 'spa', 'gimnasio', 'otros']
  }
});

// Índices para optimizar búsquedas
hotelSchema.index({ zona: 1 });
hotelSchema.index({ estado: 1 });

module.exports = mongoose.model('Hotel', hotelSchema);

