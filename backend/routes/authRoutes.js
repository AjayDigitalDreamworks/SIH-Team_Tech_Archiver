const express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();

router.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user;
    if (user.role === "admin" || user.role === "doctor") {
      return res.redirect("/admin/dashboard"); 
    } else if (user.role === "patient") {
      return res.redirect("/patient/dashboard"); 
    }
  }

  res.render('login', {msg: ""});
});



router.get("/register", (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user;
    if (user.role === "admin" || user.role === "doctor") {
      return res.redirect("/admin/dashboard"); 
    } else if (user.role === "patient") {
      return res.redirect("/patient/dashboard"); 
    }
  }

  res.render('login', {msg: ""});
});
// Register route
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user) {
    //   return res.status(400).json({ msg: "User already exists" });
      return res.render("login", { msg: "Error: User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, role });
    await newUser.save();
    // res.send.status(201).json({ msg: "User registered successfully" });
    res.render("login", { msg: "Success: User registered successfully" });
  } catch (err) {
    // res.send.status(500).json({ msg: "Server error" });
    res.render("login", {msg: "Error: Server error"})
  }
});

// Login route (using Passport.js local strategy)
router.post("/login", (req, res, next) => {
   passport.authenticate("local", (err, user, info) => {
      if (err) {
         return next(err);
      }
      if (!user) {
         return res.render("login", { msg: "Error: Invalid email or password" }); 
      }

      req.login(user, (err) => {
         if (err) {
            return next(err);
         }
         // Redirect based on user role
         if (user.role === "admin" || user.role === "doctor") {
            return res.redirect("/admin/dashboard"); 
         } else if (user.role === "patient") {
            return res.redirect("/patient/dashboard"); 
         } else {
            return res.redirect("/"); 
         }
      });
   })(req, res, next);
});




// Logout route
router.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.clearCookie('connect.sid'); 
        res.redirect("/api/auth/login");
    });
});


module.exports = router;
