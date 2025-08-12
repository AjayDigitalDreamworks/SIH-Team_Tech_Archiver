const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const User = require("../models/User");

module.exports = function(passport) {
  // Local strategy for handling login
  passport.use(
    new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
      User.findOne({ email })
        .then((user) => {
          if (!user) {
            return done(null, false, { message: "Incorrect email" });
          }

          // Compare hashed passwords
          bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
              return done(null, user);
            } else {
              return done(null, false, { message: "Incorrect password" });
            }
          });
        })
        .catch((err) => console.log(err));
    })
  );

  // Serialize user into session
  passport.serializeUser((user, done) => {
    done(null, user.id); // Store user ID in session
  });

  // Deserialize user from session (use async/await)
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id); // Use async/await to fetch the user
      done(null, user); // Attach user to request object
    } catch (err) {
      done(err, null);
    }
  });
};
