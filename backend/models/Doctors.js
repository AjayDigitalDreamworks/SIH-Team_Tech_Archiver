const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    qualifications: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },

    // Schedule: { "2025-08-25": ["10:00", "11:00", "14:00"] }
    schedule: {
        type: Map,
        of: [String], // Map of date (YYYY-MM-DD) => array of time strings
        default: {}
    },

    status: {
        type: String,
        enum: ['Available', 'Busy', 'On Break'],
        default: 'Available'
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Doctor", doctorSchema);
