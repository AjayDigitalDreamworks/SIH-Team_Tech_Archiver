const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    qualifications:{
        type: String,
        required: true
    },
    department:{
        type: String,
        required: true
    },
    availableSlots: 
    [{ type: String,
        default: "Available"
     }],
     status: { 
        type: String, 
        enum: ['Available', 'Busy', 'On Break'],
        default: 'Available' // Default value if status is not provided
    },
     createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Doctor", doctorSchema)