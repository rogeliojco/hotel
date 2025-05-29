const User = require('../models/user');
const Reserva = require('../models/reserva');
const Recomendacion = require('../models/recomendacion');
const Resena = require('../models/resena');
const Notificacion = require('../models/notificacion'); // Modelo de notificaciones

// Vista principal del perfil
exports.verPerfil = async (req, res) => {
  try {
    const user = req.user;

    // Obtener reservas
    const reservas = await Reserva.find({ email: user.email });
    const reservasActivas = reservas.filter(r => r.estado !== 'cancelada');
    const reservasCanceladas = reservas.filter(r => r.estado === 'cancelada');

    // Obtener recomendaciones
    let recomendaciones = await Recomendacion.find().limit(3);
    if (!recomendaciones.length) {
      recomendaciones = [
        { nombre: 'Casa Bonita', descripcion: 'Un lugar ideal para relajarte en la playa', hotelId: null },
        { nombre: 'Hotel Sol y Mar', descripcion: 'Hermosa vista al mar y desayuno incluido', hotelId: null },
        { nombre: 'Resort Luna Azul', descripcion: 'Ideal para una escapada romántica', hotelId: null }
      ];
    }

    // Obtener reseñas
    let reseñas = await Resena.find({ usuario: user._id }).populate('hotel');
    if (!reseñas.length) {
      reseñas = [
        {
          comentario: 'Muy recomendado. Todo fue perfecto.',
          calificacion: 5,
          hotel: { nombre: 'Hotel del Mar' }
        },
        {
          comentario: 'Habitaciones limpias y personal amable.',
          calificacion: 4,
          hotel: { nombre: 'Resort Azul' }
        }
      ];
    }

    // Obtener notificaciones
    const notificaciones = await Notificacion.find({ usuario: user._id })
      .sort({ fecha: -1 })
      .limit(10);

    res.render('perfil', {
      user,
      reservasActivas,
      reservasCanceladas,
      recomendaciones,
      reseñas,
      notificaciones,
      success: req.query.success,
      error: req.query.error
    });

  } catch (error) {
    console.error('Error al cargar el perfil:', error);
    res.redirect('/?error=No se pudo cargar el perfil. Intenta de nuevo más tarde.');
  }
};

// Actualizar nombre y/o contraseña
exports.actualizarPerfil = async (req, res) => {
  const { nuevoUsuario, nuevaContrasena } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (nuevoUsuario?.trim()) {
      user.name = nuevoUsuario.trim();
    }

    if (nuevaContrasena?.trim()) {
      if (nuevaContrasena.length < 6) {
        return res.redirect('/perfil?error=La contraseña debe tener al menos 6 caracteres');
      }
      user.password = user.encriptarContraseña(nuevaContrasena);
    }

    await user.save();
    res.redirect('/perfil?success=Perfil actualizado correctamente');

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.redirect('/perfil?error=Error al actualizar el perfil. Intenta nuevamente.');
  }
};

// Cambiar contraseña desde formulario independiente
exports.cambiarPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.compararContraseña(currentPassword)) {
      return res.redirect('/perfil?error=La contraseña actual es incorrecta');
    }

    if (!newPassword?.trim() || newPassword.length < 6) {
      return res.redirect('/perfil?error=La nueva contraseña debe tener al menos 6 caracteres');
    }

    user.password = user.encriptarContraseña(newPassword);
    await user.save();

    res.redirect('/perfil?success=Contraseña actualizada correctamente');

  } catch (error) {
    console.error('Error al cambiar la contraseña:', error);
    res.redirect('/perfil?error=No se pudo cambiar la contraseña');
  }
};

// Editar solo el nombre
exports.editarNombre = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.redirect('/perfil?error=El nombre no puede estar vacío');
    }

    await User.findByIdAndUpdate(req.user._id, { name: name.trim() });
    res.redirect('/perfil?success=Nombre actualizado');

  } catch (error) {
    console.error('Error al editar nombre:', error);
    res.redirect('/perfil?error=No se pudo actualizar el nombre');
  }
};
