module.exports = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next(); // Proceed to the next route
  }
  res.status(401).json({ msg: "Unauthorized access. Please log in." });
};
