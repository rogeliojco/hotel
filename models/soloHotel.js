const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
<<<<<<< HEAD
  nombre: { type: String, required: true },
  descripcionCorta: String,
  zona: { type: String, required: true },
  distanciaCentro: String,
=======
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

>>>>>>> 229a026 (Subiendo módulos nuevos del perfil con diseño actualizado)
  estaCercaDe: {
    tipo: {
      type: String,
      enum: ['playa', 'centro', 'malecon', 'otro'],
<<<<<<< HEAD
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
=======
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

>>>>>>> 229a026 (Subiendo módulos nuevos del perfil con diseño actualizado)
  servicios: {
    type: [String],
    enum: ['piscina', 'wifi', 'desayuno', 'estacionamiento', 'spa', 'gimnasio', 'otros']
  }
});

<<<<<<< HEAD
=======
// Índices para optimizar búsquedas
>>>>>>> 229a026 (Subiendo módulos nuevos del perfil con diseño actualizado)
hotelSchema.index({ zona: 1 });
hotelSchema.index({ estado: 1 });

module.exports = mongoose.model('Hotel', hotelSchema);
