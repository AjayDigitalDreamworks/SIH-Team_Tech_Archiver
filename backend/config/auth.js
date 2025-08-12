module.exports = {
    ensureAuthenticated: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next(); // If authenticated, proceed to the next route handler
        } else {
            res.redirect('/api/auth/login'); // Redirect to login page if not authenticated
        }
    }
};
