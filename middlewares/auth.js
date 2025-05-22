function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.rol === 'admin') {
    return next();
  }
  res.redirect('/');
}

module.exports = { isAdmin };
