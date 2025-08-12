const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: String, required: true },
    department: { type: String, required: true }, 
    date: { type: Date, required: true },
    time: { type: String, required: true },
    status: { type: String, default: 'Pending' },
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
