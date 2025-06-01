const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+@.+\..+/, 'El correo no es válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria']
  },
  rol: {
    type: String,
    enum: ['Cliente', 'Empleado', 'Admin'],
    default: 'Cliente'
  },
  fechaRegistro: {
    type: Date,
    default: Date.now
  },
  avatarUrl: {
  type: String,
  default: '/images/avatar-generico.png'
}
});

// Encripta automáticamente antes de guardar, si la contraseña fue modificada
userSchema.pre('save', function (next) {
  const user = this;
  if (!user.isModified('password')) return next();

  try {
    const salt = bcrypt.genSaltSync(10);
    user.password = bcrypt.hashSync(user.password, salt);
    next();
  } catch (err) {
    return next(err);
  }
});

// Método para comparar contraseñas al iniciar sesión
userSchema.methods.compararContraseña = function (password) {
  return bcrypt.compareSync(password, this.password);
};

// Método para encriptar contraseñas manualmente (por ejemplo al actualizar perfil)
userSchema.methods.encryptPassword = function (password) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

module.exports = mongoose.model('User', userSchema);
