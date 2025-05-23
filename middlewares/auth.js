function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}


function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.rol === 'admin') {
    return next();
  }
  res.redirect('/');
}


module.exports = { isAuthenticated, isAdmin };
