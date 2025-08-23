const express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
require('dotenv').config();
const User = require("../models/User");
const router = express.Router();

router.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user;
    if (user.role === "admin" || user.role === "doctor") {
      return res.redirect("/");
    } else if (user.role === "patient") {
      return res.redirect("/");
    }
  }

  res.render("login", { msg: "" });
});

function isValidEmail(email) {
  const emailRegex =
    /^[\w.-]+@(gmail\.com|hotmail\.com|outlook\.com|yahoo\.com|icloud\.com)$/i;
  return emailRegex.test(email);
}

// function isValidPassword(password) {
//   const passwordRegex =
//     /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
//   return passwordRegex.test(password);
// }

router.get("/register", (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user;
    if (user.role === "admin" || user.role === "doctor") {
      return res.redirect("/");
    } else if (user.role === "patient") {
      return res.redirect("/");
    }
  }

  res.render("login", { msg: "" });
});
// Register route
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user) {
      return res.render("login", { msg: "Error: User already exists" });
    }

    if (!isValidEmail(email)) {
      return res.render("login", { msg: "Error: Use a valid Email ID!" });
    }

    // if (!isValidPassword(password)) {
    //   return res.render("login", { msg: "Error: Password length must be 8 - Abcd@1234!" });
    // }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      verificationToken,
      isVerified: false,
    });

    await newUser.save();

    // Send verification email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
    });

   const mailOptions = {
  from: `"Autenic Support" <autenicyt@gmail.com>`,
  to: email,
  subject: "Verify your email address",
  html: `
    <h2>Hello!</h2>
    <p>Thanks for registering. Please click the link below to verify your email address:</p>
    <a href="https://sih-team-tech-archiver.onrender.com/api/auth/verify-email?token=${verificationToken}">Verify Email</a>
    <p>If you didn’t request this, please ignore this email.</p>
  `,
};

    await transporter.sendMail(mailOptions);

    return res.render("login", {
      msg: "Success: Verification email sent. Please check your inbox.",
    });
  } catch (err) {
    console.error(err);
    res.render("login", { msg: "Error: Server error" });
  }
});

// VERIFY EMAIL Route
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.render("login", { msg: "Error: Invalid or expired token." });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return res.render("login", {
      msg: "Success: Email verified. You can now log in.",
    });
  } catch (err) {
    console.error(err);
    res.render("login", { msg: "Error: Server error" });
  }
});

// LOGIN Route
router.post("/login", (req, res, next) => {
  passport.authenticate("local", async (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.render("login", { msg: "Error: Invalid email or password" });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.render("login", {
        msg: "Error: Please verify your email before logging in.",
      });
    }

    req.login(user, (err) => {
      if (err) return next(err);
      return res.redirect("/");
    });
  })(req, res, next);
});

// Logout route
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});




module.exports = router;
