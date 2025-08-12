// const express = require('express');
// const router = express.Router();
// const Appointment = require('../models/Appointment');
// const { ensureAuthenticated } = require('../config/auth'); // Middleware to check if user is logged in

// // Route to book an appointment
// router.post('/book-appointment', ensureAuthenticated, (req, res) => {
//     const { doctor, department, date, time } = req.body;
    
//     // Validate if all fields are filled
//     if (!doctor || !department || !date || !time) {
//         return res.status(400).render('patient/dashboard', { msg: 'Please fill in all the fields.' });
//     }

//     // Create a new appointment
//     const newAppointment = new Appointment({
//         patient: req.user._id, // The logged-in user (patient)
//         doctor,
//         department,
//         date,
//         time
//     });

//     // Save the appointment to the database
//     newAppointment
//         .save()
//         .then(() => {
//             // Redirect to the patient's dashboard after successful appointment booking
//             res.redirect('/patient/dashboard');
//         })
//         .catch((err) => {
//             console.log(err);
//             res.status(500).render('patient/dashboard', { msg: 'Error booking the appointment. Please try again.' });
//         });
// });

// module.exports = router;
