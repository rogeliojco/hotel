const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/user");

// ===========================
// Serialización de usuario
// ===========================
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (!user) return done(new Error("Usuario no encontrado"), null);
    done(null, user);
  } catch (err) {
    console.error("Error en deserialización:", err);
    done(err, null);
  }
});

// ===========================
// Estrategia de Registro
// ===========================
passport.use(
  "registro-local",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true
    },
    async (req, email, password, done) => {
      try {
        const emailNormalizado = email?.trim().toLowerCase();
        const nombre = req.body.name?.trim();

        if (!nombre || !emailNormalizado || !password) {
          return done(null, false, req.flash("mensajeRegistro", "Todos los campos son obligatorios."));
        }

        const userExistente = await User.findOne({ email: emailNormalizado });
        if (userExistente) {
          return done(null, false, req.flash("mensajeRegistro", "El correo ya está registrado."));
        }

        // No se encripta manualmente la contraseña, Mongoose lo hace en el pre('save')
        const nuevoUsuario = new User({
          name: nombre,
          email: emailNormalizado,
          password: password // Guardar directamente
        });

        await nuevoUsuario.save();
        return done(null, nuevoUsuario);

      } catch (err) {
        console.error("Error en estrategia 'registro-local':", err);
        return done(err);
      }
    }
  )
);

// ===========================
// Estrategia de Inicio de Sesión
// ===========================
passport.use(
  "inicio-local",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true
    },
    async (req, email, password, done) => {
      try {
        const emailNormalizado = email?.trim().toLowerCase();
        const user = await User.findOne({ email: emailNormalizado });

        if (!user) {
          return done(null, false, req.flash("mensajeLogin", "El correo no está registrado."));
        }

        // Compara contra el hash almacenado
        const passwordCorrecta = user.compararContraseña(password);
        if (!passwordCorrecta) {
          return done(null, false, req.flash("mensajeLogin", "Contraseña incorrecta."));
        }

        return done(null, user);

      } catch (err) {
        console.error("Error en estrategia 'inicio-local':", err);
        return done(err);
      }
    }
  )
);

