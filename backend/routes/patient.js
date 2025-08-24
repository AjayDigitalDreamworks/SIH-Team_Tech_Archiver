const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Appointment = require("../models/Appointment");
const { ensureAuthenticated , checkRoles } = require("../config/auth");
const Doctor = require("../models/Doctors");
const Inventory = require("../models/Inventory");
const Notification = require("../models/Notification");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const Admission = require("../models/Admission");

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper: upload to Cloudinary
const uploadToCloudinary = (fileBuffer, fileName) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto", public_id: fileName },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );
        stream.end(fileBuffer);
    });
};

// ===== Create Admission =====
router.post("/admission", ensureAuthenticated,  upload.array("documents"), async (req, res) => {
    try {
        const fileUploads = await Promise.all(
            req.files.map(file =>
                uploadToCloudinary(file.buffer, file.originalname)
            )
        );

        const admission = new Admission({
            userId: req.user._id, // Store logged-in user
            ...req.body,
            emergencyCase: req.body.emergencyCase === "on" || req.body.emergencyCase === true,
            documents: fileUploads
        });

        await admission.save();

        res.redirect("/patient/admission/list"); // Single response
    } catch (err) {
        console.error("Error creating admission:", err);
        res.status(500).render("error", { msg: "Error creating admission" });
    }
});

// ===== List Admissions for Logged-in User =====
router.get("/admission/list", ensureAuthenticated, checkRoles(['patient']), async (req, res) => {
    try {
        const admissions = await Admission.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        res.render("patient/admissions-list", {
            title: "My Records",
            user: req.user,
            admissions
        });
    } catch (err) {
        console.error("Error fetching admissions list:", err);
        res.status(500).render("error", { msg: "Error fetching your admissions." });
    }
});

// ===== Cancel Admission (only by owner) =====
router.post("/admission/:id/delete", ensureAuthenticated, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid admission ID" });
        }

        const deletedAdmission = await Admission.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!deletedAdmission) {
            return res.status(404).json({ success: false, message: "Admission not found or not authorized" });
        }

        res.json({ success: true, message: "Admission cancelled successfully" });
        res.render("patient/admissions-list", {title: "Admit records"});
    } catch (err) {
        console.error("Error cancelling admission:", err.stack);
        res.status(500).json({ success: false, message: "Error cancelling admission" });
    }
});


// ===== Render Admission Form =====
router.get("/admission", ensureAuthenticated, checkRoles(['patient']), async (req, res) => {
    try {
        const doctors = await Doctor.find();
        res.render("patient/admission", {
            title: "Admit Patient Records",
            user: req.user,
            doctor: doctors,
            msg: ""
        });
    } catch (err) {
        console.error(err);
        res.status(500).render("error", { msg: "Error fetching doctors." });
    }
});



// ===== Book Appointments =====
router.get("/bookappointments", ensureAuthenticated, checkRoles(['patient']), async (req, res) => {
    try {
        const appointments = await Appointment.find({ patient: req.user._id })
            .populate("doctor")
            .sort({ date: 1 });

        const doctors = await Doctor.find();

        res.render("patient/book", {
            title: "Book an Appointment",
            user: req.user,
            doctor: doctors,
            appointments,
            msg: ""
        });
    } catch (err) {
        console.error(err);
        res.status(500).render("error", { msg: "Error fetching appointments or doctors." });
    }
});

// Cancel appointment
router.post("/appointment/:id/cancel", ensureAuthenticated, async (req, res) => {
    try {
        await Appointment.findByIdAndUpdate(req.params.id, { status: "Cancelled" });
        res.json({ success: true, message: "Appointment cancelled successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error cancelling appointment." });
    }
});

// Reschedule appointment
router.post("/appointment/:id/reschedule", ensureAuthenticated, async (req, res) => {
    const { date, time } = req.body;
    try {
        await Appointment.findByIdAndUpdate(req.params.id, { date, time, status: "Rescheduled" });
        res.json({ success: true, message: "Appointment rescheduled successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error rescheduling appointment." });
    }
});

// Delete appointment
router.post('/appoint/:id/delete', ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  try {
    await Appointment.findByIdAndDelete(id);
    res.redirect('/patient/bookappointments'); // redirect to your appointment list page
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting appointment');
  }
});

// ===== Patient Dashboard =====
router.get("/dashboard", ensureAuthenticated , checkRoles(['patient']), async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.redirect("/api/auth/login"); // redirect to login if not logged in
        }

        const userId = req.user._id;

        // Fetch upcoming appointment for this user
        const upcomingAppointment = await Appointment.findOne({
            patient: userId,
            date: { $gte: new Date() }
        }).sort({ date: 1 });

        // Fetch admission/bed details
        const admissions = await Admission.findOne({ userId: req.user._id });

        // Example static notifications (replace with DB if needed)
        const notifications = [
            { text: "Your lab results are ready. Please check your patient portal.", time: "2 hours ago" },
            { text: "Reminder: Your appointment is tomorrow.", time: "Yesterday" },
            { text: "Hospital will have routine maintenance tonight 10 PM–2 AM.", time: "3 days ago" }
        ];

        // Queue position — placeholder demo
        const queuePosition = Math.floor(Math.random() * 5) + 1;

        // Render the EJS file and pass data
        res.render("patient/dashboard", {
            user: req.user,
            upcomingAppointment,
            admissions,
            notifications,
            queuePosition
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});


// ===== Book Appointment =====
router.post("/book-appointment", ensureAuthenticated, (req, res) => {
    const { doctor, department, date, time } = req.body;

    if (!doctor || !department || !date || !time) {
        return res.status(400).render("patient/book", { msg: "Error: Please fill in all the fields." });
    }

    const newAppointment = new Appointment({
        patient: req.user._id,
        user: req.user._id,
        doctor,
        department,
        date,
        time
    });


    newAppointment
        .save()
        .then(() => res.redirect("/patient/bookappointments"))
        .catch((err) => {
            console.error(err);
            res.status(500).render("patient/dashboard", { msg: "Error booking the appointment. Please try again." });
            console.log(err);
        });
});

module.exports = router;
