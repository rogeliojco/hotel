const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/user'); // Ajusta si tu ruta es diferente

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('✅ Conectado a MongoDB');

  const usuariosSinFecha = await User.find({ fechaRegistro: { $exists: false } });

  console.log(Usuarios sin fechaRegistro: ${usuariosSinFecha.length});

  for (const user of usuariosSinFecha) {
    user.fechaRegistro = new Date();
    await user.save();
    console.log(✔ Fecha asignada a: ${user.email});
  }

  console.log('🎉 Proceso completado');
  mongoose.disconnect();
}).catch(err => {
  console.error('❌ Error de conexión:', err);
});