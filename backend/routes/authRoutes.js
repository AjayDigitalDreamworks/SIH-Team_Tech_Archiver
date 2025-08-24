const express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
require('dotenv').config();
const sendEmail = require('../util/sendEmail');
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
    /^[\w.-]+@(gmail\.com|hotmail\.com|outlook\.com|yahoo\.com|icloud\.com|acem.edu\.in)$/i;
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


// gorget


router.get('/forgot', (req, res) => {
  res.render('forgot.ejs', {msg:" "}); // make a simple EJS page with email input
});



// 

router.get('/reset/:token', async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() } // Not expired
  });

  if (!user) {
    return res.render('forgot', { msg: "Password reset link is invalid or has expired." });
  }

  res.render('reset', { token: req.params.token , msg: " "});
});


// 

router.post('/reset/:token', async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.render('forgot', { msg: "Password reset token is invalid or expired." });
  }

  const { password, confirm } = req.body;
  if (password !== confirm) {
    return res.render('reset', { token: req.params.token, msg: "Passwords do not match." });
  }

  // Update password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.redirect('/api/auth/login'); // Or show success message
});



// 



// const crypto = require('crypto');
// const User = require('../models/User');
// const sendEmail = require('../utils/sendEmail'); // create this file

router.post('/forgot', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.render('forgot', { msg: "No account with that email found." });
  }

  // Generate token
  const token = crypto.randomBytes(20).toString('hex');

  // Save token and expiry to user
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  // Send reset email
  const resetLink = `http://${req.headers.host}/api/auth/reset/${token}`;
  const html = `
    <p>Hello ${user.name},</p>
    <p>You requested a password reset.</p>
    <p><a href="${resetLink}">Click here to reset your password</a></p>
    <p>This link expires in 1 hour.</p>
  `;

  await sendEmail(user.email, 'Password Reset Request', html);

  res.render('forgot', { msg: "An email has been sent with further instructions." });
});



module.exports = router;
