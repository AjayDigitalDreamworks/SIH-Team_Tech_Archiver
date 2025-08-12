const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const { ensureAuthenticated } = require("../config/auth");
const Bed = require("../models/Bed");
const Inventory = require("../models/Inventory");
const Doctor = require("../models/Doctors");
const Notification = require("../models/Notification");
const moment = require("moment");
const Patient = require("../models/Patient");
const OPDQueue = require("../models/Opd");

// const bedOccupancyData = [];

router.get("/dashboard", ensureAuthenticated, async (req, res) => {
  try {
    // Only allow admins or doctors
    if (req.user.role !== "admin" && req.user.role !== "doctor") {
      return res.redirect("/api/auth/login");
    }

    // discharge data

    const recentDischarges = await Bed.find({
  dischargeDate: { $ne: null }
}).sort({ dischargeDate: -1 }).limit(10).select('patient id name ward dischargeDate');



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
router.get("/appointments", ensureAuthenticated, async (req, res) => {
  try {
    const appointments = await Appointment.find();
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
router.get("/inventory", ensureAuthenticated, async (req, res) => {
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

router.get("/bed", ensureAuthenticated, async (req, res) => {

    const beds = await Bed.find().lean();

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
  const availableBeds = beds.filter(b => b.status === 'available').length;
  const maintenanceBeds = 0; // Add if you have a field for maintenance

  res.render('bed-managemnt', {
    title: 'Beds Management',
    beds,
    totalBeds,
    occupiedBeds,
    availableBeds,
    maintenanceBeds
  });
//   res.render("bed-managemnt", { title: "Beds Management" });
});


// ======== opd =========
router.get("/opd", ensureAuthenticated, async (req, res) => {
  
  try {
    const queueData = await OPDQueue.find().sort({ checkInTime: 1 }).lean();
    const doctors = await Doctor.find({}).sort({ name: 1 });

    const totalPatients = queueData.length;
    const avgWaitTime = totalPatients 
      ? Math.round(queueData.reduce((sum, p) => sum + (p.waitTime || 0), 0) / totalPatients)
      : 0;

    const completed = queueData.filter(p => p.status === "completed").length;
    const waiting = queueData.filter(p => p.status === "waiting").length;

    res.render("opd", {
       title: "OPD Queue Management",
       totalPatients,
       avgWaitTime,
       waiting,
       completed,
       doctorsData: doctors,
       queue: queueData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch queue" });
  }
});



// =========== dashboard ======
// =========Emergency route ========
router.get("/emergency", (req, res) => {
  res.render("emergency", { title: "Emergency Admissions" });
});

module.exports = router;
