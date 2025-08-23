const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
dotenv.config();
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
require("./config/passport")(passport);

app.use(
  session({
    secret: process.env.SECRET_KEY, 
    resave: false,                  
    saveUninitialized: true,       
    cookie: { secure: false },      
  })
);

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));
app.use(express.static(path.join(__dirname,"../frontend/public")));


// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Sample route
app.get("/", (req, res) => {
  res.render("index", { title: "Welcome to the Admin Panel" });
});


const adminRouter = require('./routes/admin');
const patientRouter = require('./routes/patient');
app.use('/admin', adminRouter);
app.use('/patient', patientRouter);
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);



// const methodOverride = require('method-override');
// app.use(methodOverride('_method'));


// Port configuration
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
