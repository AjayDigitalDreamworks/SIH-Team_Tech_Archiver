const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctors');

// API: Get available dates for doctor
router.get('/api/doctors/dates', async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ name: req.query.doctorName });
        if (!doctor || !doctor.schedule) return res.json({ dates: [] });

        const dates = Array.from(doctor.schedule.keys());
        res.json({ dates });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// API: Get available time slots for doctor on a given date
router.get('/api/doctors/timeslots', async (req, res) => {
    try {
        const { doctorName, date } = req.query;

        const doctor = await Doctor.findOne({ name: doctorName });
        if (!doctor || !doctor.schedule || !doctor.schedule.has(date)) {
            return res.json({ timeSlots: [] });
        }

        res.json({ timeSlots: doctor.schedule.get(date) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
