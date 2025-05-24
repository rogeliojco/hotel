const mongoose = require('mongoose');

const habitacionSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['unaPersona', 'dosPersonas', 'cuatroPersonas', 'seisPersonas'],
    required: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  precioNoche: {
    type: Number,
    min: 0,
    required: true
  },
  disponible: {
    type: Boolean,
    default: true
  },
  imagenes: [
    {
      type: String,
      validate: {
        validator: function (v) {
          return /^https?:\/\/.+/i.test(v);
        },
        message: props => `${props.value} no es un URL válido.`
      }
    }
  ],
  reservas: [
    {
      fechaInicio: { type: Date, required: true },
      fechaFin: { type: Date, required: true }
    }
  ],
  detalleHabitacion: {
    aireAcondicionado: { type: Number, default: 0, min: 0 },
    camas: { type: Number, default: 1, min: 1 },
    televisiones: { type: Number, default: 0, min: 0 },
    banos: { type: Number, default: 1, min: 0 },
    alberca: { type: Boolean, default: false },
    jacuzzi: { type: Boolean, default: false },
    wifi: { type: Boolean, default: true },
    balcon: { type: Boolean, default: false },
    cocina: { type: Boolean, default: false },
    minibar: { type: Boolean, default: false }
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  }
});

// Índice único para evitar nombres repetidos en el mismo hotel
habitacionSchema.index({ hotel: 1, nombre: 1 }, { unique: true });

module.exports = mongoose.model('Habitacion', habitacionSchema);
