const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: String,
    dateOfBirth: Date,
    gender: String,
    contactNumber: String,
    emailAddress: String,
    address: String,
    currentMedications: String,
    knownAllergies: String,
    pastConditions: String,
    department: String,
    preferredDoctor: String,
    preferredDate: Date,
    preferredTime: String,
    emergencyCase: Boolean,
    emergencyReason: String,
    documents: [String], // Cloudinary URLs
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Admission", admissionSchema);
