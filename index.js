const express = require('express');
const path = require('path');
const engine = require('ejs-mate');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');





const app = express();
require('./database');
require('./passport/local-auth')

app.set('port', process.env.PORT || 3000);

app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.engine('ejs', engine);
app.set('view engine', 'ejs');

//middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({extended:false}))
app.use(flash())

app.use(session({
    secret: 'mysecretsession',
    resave: false,
    saveUninitialized:false
}))


app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next)=>{
    app.locals.mensajeRegistro = req.flash('mensajeRegistro')
    app.locals.mensajeLogin = req.flash('mensajeLogin')
    app.locals.user = req.user;    
    next();
})

app.use('/', require('./rutas'));

//iniciando el servidor

app.listen(app.get('port'), () =>{
    console.log('Servidor iniciado en el puerto', app.get('port'));
});

