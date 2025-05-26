const mongoose = require('mongoose');
require('dotenv').config();

const dbURI = process.env.MONGODB_URI;

mongoose.connect(dbURI, {})
    .then(() => console.log('Base de datos conectada con éxito'))
    .catch(err => console.error('Error al conectar a la base de datos:', err));
