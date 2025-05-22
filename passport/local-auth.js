const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/user");

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

passport.use(
  "registro-local",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      const user = await User.findOne({ email: email });
      if (user) {
        return done(null, false, req.flash("mensajeRegistro", "El usuario ya existe"));
      } else {
        const newUser = new User(); // 👈 asegúrate de usar 'new'
        newUser.name = req.body.name; // ✅ GUARDAR EL NOMBRE
        newUser.email = email;
        newUser.password = newUser.encriptarContraseña(password);
        await newUser.save();
        return done(null, newUser);
      }
    }
  )
);

passport.use('inicio-local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, email, password, done)=>{
    const user = await User.findOne({email:email})
    if (!user) {
        return done(null, false, req.flash('mensajeLogin', 'El usuario no esta registrado'))
    }
    if (!user.compararContraseña(password)) {
        return done(null, false, req.flash('mensajeLogin', 'Contraseña incorrecta'))
    }
    done(null, user)

}))
