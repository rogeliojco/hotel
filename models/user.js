const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const userSchema = new mongoose.Schema({
  name: String, // <- importante para el perfil
  email: String,
  password: String,
  rol: { type: String, default: 'Cliente' } // cliente, empleado o admin
});

userSchema.methods.encriptarContraseña = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};

userSchema.methods.compararContraseña = function (password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);