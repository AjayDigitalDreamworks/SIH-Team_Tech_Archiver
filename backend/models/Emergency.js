const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  contactNumber: { type: String, required: true },
  chiefComplaint: { type: String, required: true },
  vitals: {
    BP: { type: String, required: true },
    temp: { type: String, required: true },
    heartRate: { type: Number, required: true },
    SpO2: { type: String, required: true },
  },
  referringDoctor: { type: String },
});

const Emergency = mongoose.model('Emergency', emergencySchema);

module.exports = Emergency;
