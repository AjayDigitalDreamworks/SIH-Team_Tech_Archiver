const mongoose = require('mongoose');

const opdQueueSchema = new mongoose.Schema({
  tokenNumber: { type: String, required: true }, 
  patient: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }, 
    name: { type: String, required: true },
    age: Number,
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    contact: String
  },
  department: { type: String, required: true }, 
  doctor: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    name: String
  },
  status: { 
    type: String, 
    enum: ['waiting', 'consulting', 'called', 'completed', 'cancelled'], 
    default: 'waiting' 
  },
  waitTime: { type: Number, default: 0 }, 
  appointmentTime: Date,
  checkInTime: { type: Date, default: Date.now }, 
  startConsultationTime: Date,
  endConsultationTime: Date,
  remarks: String
}, { timestamps: true });

module.exports = mongoose.model('OPDQueue', opdQueueSchema);
