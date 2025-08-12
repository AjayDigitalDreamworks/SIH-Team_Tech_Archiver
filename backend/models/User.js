const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "patient" },  // Can be "admin", "doctor", "patient"
});

module.exports = mongoose.model("User", UserSchema);
