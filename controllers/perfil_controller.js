const User = require('../models/user');
const Reserva = require('../models/reserva');

exports.verPerfil = async (req, res) => {
  try {
    const reservas = await Reserva.find({ email: req.user.email });
    req.user.reservas = reservas;
    res.render('perfil', {
      user: req.user
    });
  } catch (error) {
    console.error('Error al cargar perfil:', error);
    res.redirect('/?error=No se pudo cargar el perfil');
  }
};

exports.editarNombre = async (req, res) => {
  try {
    const { name } = req.body;
    await User.findByIdAndUpdate(req.user._id, { name });
    res.redirect('/perfil?success=Nombre actualizado');
  } catch (error) {
    console.error('Error al editar nombre:', error);
    res.redirect('/perfil?error=No se pudo actualizar el nombre');
  }
};

exports.cambiarPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!user.compararContraseña(currentPassword)) {
    return res.redirect('/perfil?error=La contraseña actual no es válida');
  }
  user.password = user.encriptarContraseña(newPassword);
  await user.save();
  res.redirect('/perfil?success=Contraseña actualizada correctamente');
};