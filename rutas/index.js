const express = require('express');
const passport = require('passport');
const router = express.Router();
const Producto = require('../models/Producto');


const estadosMexico = [
  { id: 1, nombre: "Aguascalientes" },
  { id: 2, nombre: "Baja California" },
  { id: 3, nombre: "Baja California Sur" },
  { id: 4, nombre: "Campeche" },
  { id: 5, nombre: "Chiapas" },
  { id: 6, nombre: "Chihuahua" },
  { id: 7, nombre: "Ciudad de México" },
  { id: 8, nombre: "Coahuila" },
  { id: 9, nombre: "Colima" },
  { id: 10, nombre: "Durango" },
  { id: 11, nombre: "Estado de México" },
  { id: 12, nombre: "Guanajuato" },
  { id: 13, nombre: "Guerrero" },
  { id: 14, nombre: "Hidalgo" },
  { id: 15, nombre: "Jalisco" },
  { id: 16, nombre: "Michoacán" },
  { id: 17, nombre: "Morelos" },
  { id: 18, nombre: "Nayarit" },
  { id: 19, nombre: "Nuevo León" },
  { id: 20, nombre: "Oaxaca" },
  { id: 21, nombre: "Puebla" },
  { id: 22, nombre: "Querétaro" },
  { id: 23, nombre: "Quintana Roo" },
  { id: 24, nombre: "San Luis Potosí" },
  { id: 25, nombre: "Sinaloa" },
  { id: 26, nombre: "Sonora" },
  { id: 27, nombre: "Tabasco" },
  { id: 28, nombre: "Tamaulipas" },
  { id: 29, nombre: "Tlaxcala" },
  { id: 30, nombre: "Veracruz" },
  { id: 31, nombre: "Yucatán" },
  { id: 32, nombre: "Zacatecas" }
];

router.get('/registro', (req, res, next) =>{
    res.render('registro')
})
router.get('/Login', (req, res, next) =>{
    res.render('login')
})
router.get('/', (req, res, next) =>{
  res.render('paginaPrincipal', { estados: estadosMexico });
})


router.get('/Perfil', isAuthenticated,(req, res, next) =>{
    res.render('perfil')
})

router.get('/Salir', (req, res, next) =>{
    req.logOut((err) =>{
        if(err) return next(err);
        res.redirect('/')
    })
})




router.post('/registro', passport.authenticate('registro-local',{
    successRedirect: '/',
    failureRedirect: '/registro',
    passReqToCallback: true
}))

router.post('/Login', passport.authenticate('inicio-local',{
    successRedirect: '/',
    failureRedirect: '/Login',
    passReqToCallback: true
}))

function isAuthenticated(req, res, next) {
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/');
}


// Ruta que recibe el formulario principal
router.post('/reservar', (req, res) => {
    const { ciudad, fechas, habitacion, codigo } = req.body;

    // Renderiza la vista de reserva con los datos
    res.render('reserva', {
        ciudad,
        fechas,
        habitacion,
        codigo
    });
});



module.exports = router;