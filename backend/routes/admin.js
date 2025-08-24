const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const { ensureAuthenticated , checkRoles } = require("../config/auth");
const Bed = require("../models/Bed");
const Inventory = require("../models/Inventory");
const Doctor = require("../models/Doctors");
const sendEmail = require('../util/sendEmail');
const Notification = require("../models/Notification");
const moment = require("moment");
const Patient = require("../models/Patient");
const {Queue} = require("../models/Opd");

// const bedOccupancyData = [];

router.get("/dashboard", ensureAuthenticated, checkRoles(['admin', 'doctor']), async (req, res) => {
  try {
    // Only allow admins or doctors
    if (req.user.role !== "admin" && req.user.role !== "doctor") {
      return res.redirect("/api/auth/login");
    }

    // discharge data

    const recentDischarges = await Bed.find({
  dischargeDate: { $ne: null }
}).sort({ dischargeDate: -1 }).limit(10).select('patient id name ward dischargeDate');



const opds = await Queue.find({});

const opd = opds.length;
    // Beds summary
    const beds = await Bed.find({});
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter((b) => b.status === "occupied").length;
    const availableBeds = totalBeds - occupiedBeds;

    // Bed Occupancy Trends - last 7 days
    const today = new Date();
    let bedOccupancyData = [];

    for (let i = 6; i >= 0; i--) {
      let day = new Date(today);
      day.setHours(0, 0, 0, 0); // Set to start of day
      day.setDate(today.getDate() - i);

      // Count occupied beds on this day
      const occupiedCount = await Bed.countDocuments({
        admitDate: { $lte: day },
        $or: [{ dischargeDate: { $gte: day } }, { dischargeDate: null }],
        status: "occupied",
      });

      bedOccupancyData.push({
        date: day.toISOString().slice(0, 10), // 'YYYY-MM-DD'
        occupied: occupiedCount,
        available: totalBeds - occupiedCount,
      });
    }

    // Inventory summary
    const inventoryItems = await Inventory.find({})
      .sort({ last_updated: -1 })
      .limit(10);

    // Doctors list
    const doctors = await Doctor.find({}).sort({ name: 1 });

    // OPD Queue Breakdown - patients by department (waiting)
    const opdAggregation = await Patient.aggregate([
      { $match: { status: "waiting" } }, // only patients in queue
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Format for frontend chart
    const opdBreakdownLabels = opdAggregation.map((d) => d._id);
    const opdBreakdownData = opdAggregation.map((d) => d.count);

    // Pass all to EJS
    res.set("Cache-Control", "no-store");
    res.render("dashboard", {
      title: "Admin Dashboard",
      user: req.user,
      dashboardStats: {
        totalBeds,
        occupiedBeds,
        availableBeds,
      },
      bedOccupancyData, // last 7 days data for bed occupancy
      inventoryData: inventoryItems,
      doctorsData: doctors,
      recentDischarges,
      // New data for OPD breakdown
      //   opdBreakdownLabels,
      //   opdBreakdownData
      opd,

      opdBreakdownLabels: [
        "General Medicine",
        "Pediatrics",
        "Orthopedics",
        "Cardiology",
      ], // ya dynamically Mongo se
      opdBreakdownData: [35, 25, 20, 20], // same length as labels
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).send("Server Error");
  }
});

// =========== appointment ==========
router.get("/appointments", ensureAuthenticated, checkRoles(['admin', 'doctor']), async (req, res) => {
  try {
    // const appointments = await Appointment.find();
    const appointments = await Appointment.find().populate("patient");

    const confirmAppointments = appointments.filter(
      (a) => a.status.toLowerCase() === "confirmed"
    ).length;
    const pendingAppointments = appointments.filter(
      (a) => a.status.toLowerCase() === "pending"
    ).length;
    const completedAppointments = appointments.filter(
      (a) => a.status.toLowerCase() === "completed"
    ).length;
    const cancelAppointments = appointments.filter(
      (a) => a.status.toLowerCase() === "cancelled"
    ).length;

    // === stats ========
    const todayStart = moment().startOf("day").toDate();
    const todayEnd = moment().endOf("day").toDate();

    const weekStart = moment().startOf("week").toDate();
    const weekEnd = moment().endOf("week").toDate();

    const monthStart = moment().startOf("month").toDate();
    const monthEnd = moment().endOf("month").toDate();

    const todaysAppointments = await Appointment.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd },
    });

    const weekAppointments = await Appointment.countDocuments({
      date: { $gte: weekStart, $lte: weekEnd },
    });

    const monthAppointments = await Appointment.countDocuments({
      date: { $gte: monthStart, $lte: monthEnd },
    });

    res.render("appointment", {
      title: "Appointments Management",
      appointments,
      user: req.user,
      confirmAppointments,
      pendingAppointments,
      completedAppointments,
      cancelAppointments,
      todaysAppointments,
      weekAppointments,
      monthAppointments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("error", { msg: "Error fetching appointments." });
  }
});


// ============ delay ========

router.post('/appointment/:id/delay', async (req, res) => {
  const { id } = req.params;
  const { delayMinutes } = req.body;

  try {
    const appointment = await Appointment.findById(id).populate('user'); // assuming user = patient
    if (!appointment) return res.status(404).send('Appointment not found');

    // Update status or time
    appointment.status = 'delayed';
    await appointment.save();

    // Send patient email
    const patientEmail = appointment.user.email;
    const html = `
      <p>Dear ${appointment.user.name},</p>
      <p>Your appointment with <strong>Dr. ${appointment.doctor}</strong> on <strong>${new Date(appointment.date).toLocaleDateString()}</strong> at <strong>${appointment.time}</strong> has been delayed by <strong>${delayMinutes} minutes</strong>.</p>
      <p>We apologize for the inconvenience.</p>
    `;

    await sendEmail(patientEmail, 'Appointment Delay Notification', html);

    // (Optional) Send admin email
    const adminEmail = 'admin@yourclinic.com';
    await sendEmail(adminEmail, 'Patient Appointment Delayed', `
      <p>Appointment for ${appointment.user.name} delayed by ${delayMinutes} minutes.</p>
    `);

    res.send('Delay notification sent');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error notifying delay');
  }
});


// ====== Confirm Appointment ======
router.post(
  "/appointments/:id/confirm",
  ensureAuthenticated,
  async (req, res) => {
    try {
      await Appointment.findByIdAndUpdate(req.params.id, {
        status: "confirmed",
      });
      res.redirect("/admin/appointments");
    } catch (err) {
      console.error(err);
      res.status(500).render("error", { msg: "Error confirming appointment." });
    }
  }
);

// ====== Reject Appointment ======
router.post(
  "/appointments/:id/reject",
  ensureAuthenticated,
  async (req, res) => {
    try {
      await Appointment.findByIdAndUpdate(req.params.id, {
        status: "cancelled",
      });
      res.redirect("/admin/appointments");
    } catch (err) {
      console.error(err);
      res.status(500).render("error", { msg: "Error rejecting appointment." });
    }
  }
);

// ====== Complete Appointment ======
router.post(
  "/appointments/:id/complete",
  ensureAuthenticated,
  async (req, res) => {
    try {
      await Appointment.findByIdAndUpdate(req.params.id, {
        status: "completed",
      });
      res.redirect("/admin/appointments");
    } catch (err) {
      console.error(err);
      res.status(500).render("error", { msg: "Error completing appointment." });
    }
  }
);

// ===== inventory ======
router.get("/inventory", ensureAuthenticated, checkRoles(['admin', 'doctor']), async (req, res) => {
  try {
    const inventory = await Inventory.find().sort({ last_updated: -1 });

    const totalItems = inventory.length;
    const lowStockItems = inventory.filter(
      (item) => item.stock > 0 && item.stock <= 10
    ).length;
    const outOfStockItems = inventory.filter((item) => item.stock === 0).length;
    const recentAdditions = inventory.filter((item) => {
      const daysAgo = (Date.now() - item.createdAt) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7;
    }).length;

    res.render("inventory", {
      user: req.user,
      inventory,
      totalItems,
      lowStockItems,
      outOfStockItems,
      recentAdditions,
      title: "Inventory Managemnet",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

//  Add new item
router.post("/inventory", ensureAuthenticated, async (req, res) => {
  try {
    const { itemId, name, category, stock, status, unit } = req.body;
    await Inventory.create({
      itemId,
      name,
      category,
      stock,
      status,
      unit,
    });
    res.redirect("/admin/inventory");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to add item");
  }
});

// Edit existing item
router.post("/inventory/edit/:id", ensureAuthenticated, async (req, res) => {
  try {
    const { name, category, stock, status, unit } = req.body;
    await Inventory.findByIdAndUpdate(req.params.id, {
      name,
      category,
      stock,
      status,
      unit,
      last_updated: Date.now(),
    });
    res.redirect("/admin/inventory");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update item");
  }
});

//  Delete item
router.post("/inventory/delete/:id", ensureAuthenticated, async (req, res) => {
  try {
    await Inventory.findByIdAndDelete(req.params.id);
    res.redirect("/admin/inventory");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete item");
  }
});


// ========= beds managment ======

router.get('/bed', ensureAuthenticated, checkRoles(['admin', 'doctor']), async (req, res) => {
    try {
        const beds = await Bed.find();
        res.render('bed-managemnt', { beds, title:"Bed Management", user: req.user, });
    } catch (err) {
        console.error("Error fetching beds:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.get('/bed/new', ensureAuthenticated, checkRoles(['admin', 'doctor']), (req, res) => {
  res.render('newBed.ejs', {title:"Bed Management", user: req.user,});
});

router.post('/bed', ensureAuthenticated, async (req, res) => {
  try {
    const {
      bedId,
      ward,
      floor,
      room,
      status,
      patientName,
      patientId,
      doctor,
      condition,
      admitDate,
      dischargeDate
    } = req.body;

    // Build patient object only if status is occupied and patient info is provided
    const patient = (status === 'occupied' && patientName && patientId)
      ? { name: patientName, id: patientId }
      : undefined;

    const newBed = new Bed({
      bedId,
      ward,
      floor,
      room,
      status,
      patient,
       doctor,
      condition,
      admitDate: admitDate ? new Date(admitDate) : undefined,
      dischargeDate: dischargeDate ? new Date(dischargeDate) : undefined
    });

    await newBed.save();
    res.redirect('/admin/bed');
  } catch (err) {
    console.error("Error adding bed:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Edit Bed - Render Edit Form
router.get('/bed/:id/edit', ensureAuthenticated, checkRoles(['admin', 'doctor']), async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (!bed) return res.status(404).send("Bed not found");
    res.render('editBed.ejs', { bed, title:"Bed Management", user: req.user, });
  } catch (err) {
    console.error("Error fetching bed:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Update Bed
router.post('/bed/:id', ensureAuthenticated, async (req, res) => {
  try {
    const {
      bedId,
      ward,
      floor,
      room,
      status,
      patientName,
      patientId,
      doctor,
      condition,
      admitDate,
      dischargeDate
    } = req.body;

    const patient = (status === 'occupied' && patientName && patientId)
      ? { name: patientName, id: patientId }
      : undefined;

    await Bed.findByIdAndUpdate(req.params.id, {
      bedId,
      ward,
      floor,
      room,
      status,
      patient,
      doctor,
      condition,
      admitDate: admitDate ? new Date(admitDate) : undefined,
      dischargeDate: dischargeDate ? new Date(dischargeDate) : undefined
    });

    res.redirect('/admin/bed');
  } catch (err) {
    console.error("Error updating bed:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Delete Bed
router.post('/bed/:id/delete', ensureAuthenticated, async (req, res) => {
  try {
    await Bed.findByIdAndDelete(req.params.id);
    res.redirect('/admin/bed');
  } catch (err) {
    console.error("Error deleting bed:", err);
    res.status(500).send("Internal Server Error");
  }
});



// Show confirmation page
router.get('/bed/:id/delete', ensureAuthenticated, checkRoles(['admin', 'doctor']), async (req, res) => {
  const bed = await Bed.findById(req.params.id);
  if (!bed) return res.status(404).send('Bed not found');
  res.render('confirmDelete', { bed, title: "Confirm Delete", user: req.user, });
});





// ======== opd =========

router.get('/opd',ensureAuthenticated, checkRoles(['admin', 'doctor']), async (req, res) => {
  try {
    let data = await Queue.find();
    console.log(data);

    res.render("opd.ejs", { patients: data , title:"OPD Management", user: req.user,});

    // res.render("opd.ejs", { patients: data });

  } catch (err) {
    console.error("Error fetching patients:", err);
    res.status(500).send("Internal Server Error");
  }
});

router.get('/opd/new', ensureAuthenticated, checkRoles(['admin', 'doctor']), (req, res) => {

  res.render('newPatient.ejs', {title:"OPD Management", user: req.user,});

});


router.post('/opd', ensureAuthenticated,  async (req, res) => {
  let {name, phone, department, appointmentTime, status, priority, waitTime, position} = req.body;
  // Generate a unique id using timestamp
  let uniqueId = `T${Date.now()}`;
  let queue = new Queue({
    id: uniqueId,
    name,
    phone,
    department,
    appointmentTime,
    status,
    priority,
    waitTime,
    position
  });
  try {
    await queue.save();
    console.log("Patient added successfully");
    res.redirect('/admin/opd');
  } catch (err) {
    console.error("Error adding patient:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Edit Patient
router.get('/opd/:id/edit', ensureAuthenticated, checkRoles(['admin', 'doctor']), async (req, res) => {
  try {
    const patient = await Queue.findOne({ id: req.params.id });
    if (!patient) {
      return res.status(404).send("Patient not found");
    }

    res.render('editPatient.ejs', { patient , title:"OPD Management", user: req.user,});

  } catch (err) {
    console.error("Error fetching patient:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Update Patient (PUT request)
router.post('/opd/:id', ensureAuthenticated, async (req, res) => {
  const { name, phone, department, appointmentTime, status, priority, waitTime, position } = req.body;
  try {
    await Queue.findOneAndUpdate(
      { id: req.params.id },
      { name, phone, department, appointmentTime, status, priority, waitTime, position },
      { new: true }
    );
    res.redirect('/admin/opd');
  } catch (err) {
    console.error("Error updating patient:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Delete Patient
router.post('/opd/:id/delete', ensureAuthenticated, async (req, res) => {
  try {
    await Queue.deleteOne({ id: req.params.id });
    res.redirect('/admin/opd');
  } catch (err) {
    console.error("Error deleting patient:", err);
    res.status(500).send("Internal Server Error");
  }
});




// =========== dashboard ======
// =========Emergency route ========
router.get("/emergency", ensureAuthenticated, checkRoles(['admin', 'doctor']), (req, res) => {
  res.render("emergency", { title: "Emergency Admissions" , user: req.user,});
});

module.exports = router;
