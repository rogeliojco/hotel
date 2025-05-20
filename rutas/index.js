const express = require('express');
const passport = require('passport');
const router = express.Router();
const Producto = require('../models/Producto');




router.get('/registro', (req, res, next) =>{
    res.render('registro')
})
router.get('/Login', (req, res, next) =>{
    res.render('login')
})

router.get('/', async (req, res, next) => {
    try {
      const productos = await Producto.find();
      res.render('paginaPrincipal', { productos });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error al cargar los productos');
    }
});

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

module.exports = router;