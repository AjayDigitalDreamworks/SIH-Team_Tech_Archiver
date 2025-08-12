const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { ensureAuthenticated } = require('../config/auth');
const Doctor = require('../models/Doctors');
const Inventory = require('../models/Inventory');
const Notification = require('../models/Notification');
const moment = require("moment");





// =========== appointment ==========


router.get('/appointments', ensureAuthenticated, async (req, res) => {
    try {
    const appointments = await Appointment.find();
    const confirmAppointments = appointments.filter(a => a.status.toLowerCase() === "confirmed").length;
    const pendingAppointments = appointments.filter(a => a.status.toLowerCase() === "pending").length;
    const completedAppointments = appointments.filter(a => a.status.toLowerCase() === "completed").length;
    const cancelAppointments = appointments.filter(a => a.status.toLowerCase() === "cancelled").length;

    // === stats ========
    const todayStart = moment().startOf('day').toDate();
        const todayEnd = moment().endOf('day').toDate();

        const weekStart = moment().startOf('week').toDate();
        const weekEnd = moment().endOf('week').toDate();

        const monthStart = moment().startOf('month').toDate();
        const monthEnd = moment().endOf('month').toDate();

        const todaysAppointments = await Appointment.countDocuments({
            date: { $gte: todayStart, $lte: todayEnd }
        });

        const weekAppointments = await Appointment.countDocuments({
            date: { $gte: weekStart, $lte: weekEnd }
        });

        const monthAppointments = await Appointment.countDocuments({
            date: { $gte: monthStart, $lte: monthEnd }
        });

        res.render('appointment', {
            title: "Appointments Management",
            appointments,
            confirmAppointments,
            pendingAppointments,
            completedAppointments,
            cancelAppointments,
            todaysAppointments,
            weekAppointments,
            monthAppointments
        });

    } catch (err) {
        console.error(err);
        res.status(500).render("error", { msg: "Error fetching appointments." });
    }
});

// ====== Confirm Appointment ======
router.post('/appointments/:id/confirm', ensureAuthenticated, async (req, res) => {
    try {
        await Appointment.findByIdAndUpdate(req.params.id, { status: "confirmed" });
        res.redirect('/admin/appointments');
    } catch (err) {
        console.error(err);
        res.status(500).render("error", { msg: "Error confirming appointment." });
    }
});

// ====== Reject Appointment ======
router.post('/appointments/:id/reject', ensureAuthenticated, async (req, res) => {
    try {
        await Appointment.findByIdAndUpdate(req.params.id, { status: "cancelled" });
        res.redirect('/admin/appointments');
    } catch (err) {
        console.error(err);
        res.status(500).render("error", { msg: "Error rejecting appointment." });
    }
});

// ====== Complete Appointment ======
router.post('/appointments/:id/complete', ensureAuthenticated, async (req, res) => {
    try {
        await Appointment.findByIdAndUpdate(req.params.id, { status: "completed" });
        res.redirect('/admin/appointments');
    } catch (err) {
        console.error(err);
        res.status(500).render("error", { msg: "Error completing appointment." });
    }
});



// ========= beds managment ======

router.get("/bed", (req,res) => {
    res.render("bed-managemnt", {title:"Beds Management"});
})

// =========== dashboard ======
// =========Emergency route ========
router.get('/emergency', (req, res) => {
    res.render('emergency', {title:"Emergency Admissions"});
});

// ===== inventory ======
router.get("/inventory", ensureAuthenticated, async (req, res) => {
    try {
        const inventory = await Inventory.find().sort({ last_updated: -1 });

        const totalItems = inventory.length;
        const lowStockItems = inventory.filter(item => item.stock > 0 && item.stock <= 10).length;
        const outOfStockItems = inventory.filter(item => item.stock === 0).length;
        const recentAdditions = inventory.filter(item => {
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
            title : "Inventory Managemnet"
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
            unit
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
            last_updated: Date.now()
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



// ======== opd =========
router.get('/opd', (req, res) => {
    res.render('opd', {title:"OPD Queue Management"});
});






module.exports = router;
