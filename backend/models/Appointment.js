const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: String, // or ref if needed
  department: String,
  date: Date,
  time: String,
  status: {
    type: String,
    enum: ['Pending', 'confirmed', 'completed', 'rescheduled', 'cancelled', 'delayed'],
    default: 'Pending'
  },
  // ✅ this is required for populate to work
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model("Appointment", appointmentSchema);
