// middleware/auth.js
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/api/auth/login');
}

function checkRoles(allowedRoles) {
  return function (req, res, next) {
    console.log("Authenticated:", req.isAuthenticated());
    console.log("User role:", req.user?.role);

    if (req.isAuthenticated() && req.user && allowedRoles.includes(req.user.role)) {
      return next();
    }

    res.status(403).send('Access Denied');
  };
}


module.exports = {
  ensureAuthenticated,
  checkRoles
};
