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
  descripcion: String,
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
          return /^https?:\/\/.+/i.test(v); // acepta cualquier URL
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
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  }
});

// Índice único para evitar nombres repetidos en el mismo hotel
habitacionSchema.index({ hotel: 1, nombre: 1 }, { unique: true });

module.exports = mongoose.model('Habitacion', habitacionSchema);
