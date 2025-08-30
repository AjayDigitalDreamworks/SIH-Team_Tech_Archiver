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
const Emergency = require("../models/Emergency");

// const bedOccupancyData = [];

router.get("/dashboard", ensureAuthenticated, checkRoles(['admin', 'doctor']), async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "doctor") {
      return res.redirect("/api/auth/login");
    }

    // Fetch data for dashboard
    const recentDischarges = await Bed.find({ dischargeDate: { $ne: null } })
      .sort({ dischargeDate: -1 })
      .limit(10)
      .select('patient id name ward dischargeDate');

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
      day.setHours(0, 0, 0, 0);
      day.setDate(today.getDate() - i);

      const occupiedCount = await Bed.countDocuments({
        admitDate: { $lte: day },
        $or: [{ dischargeDate: { $gte: day } }, { dischargeDate: null }],
        status: "occupied",
      });

      bedOccupancyData.push({
        date: day.toISOString().slice(0, 10),
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
    const opdAggregation = await Queue.aggregate([
      { $match: { status: "waiting" } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const opdBreakdownLabels = opdAggregation.map((d) => d._id);
    const opdBreakdownData = opdAggregation.map((d) => d.count);

    // Pass data to EJS
    res.set("Cache-Control", "no-store");
    res.render("dashboard", {
      title: "Admin Dashboard",
      user: req.user,
      dashboardStats: {
        totalBeds,
        occupiedBeds,
        availableBeds,
        opd
      },
      bedOccupancyData,
      inventoryData: inventoryItems,
      doctorsData: doctors,
      recentDischarges,
      opdBreakdownLabels,
      opdBreakdownData
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).send("Server Error");
  }
});


// =========== appointment ==========
router.get("/appointments", ensureAuthenticated, checkRoles(['admin', 'doctor']), async (req, res) => {
  try {
    const { search, status, department, date, page = 1 } = req.query; // Extract filters and page
    const pageSize = 10; // Set the number of appointments per page

    let filter = {};

    // Apply filters
    if (search) {
      filter['patient.name'] = { $regex: search, $options: 'i' }; // Case-insensitive search
    }
    if (status) {
      filter.status = status;
    }
    if (department) {
      filter.department = department;
    }
    if (date) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let startDate, endDate;

      switch (date) {
        case "today":
          startDate = today;
          endDate = new Date(today.setHours(23, 59, 59, 999));
          break;
        case "tomorrow":
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          startDate = tomorrow;
          endDate = new Date(tomorrow.setHours(23, 59, 59, 999));
          break;
        case "week":
          const weekStart = moment().startOf("week").toDate();
          const weekEnd = moment().endOf("week").toDate();
          startDate = weekStart;
          endDate = weekEnd;
          break;
        case "month":
          const monthStart = moment().startOf("month").toDate();
          const monthEnd = moment().endOf("month").toDate();
          startDate = monthStart;
          endDate = monthEnd;
          break;
      }

      if (startDate && endDate) {
        filter.date = { $gte: startDate, $lte: endDate };
      }
    }

    // Get total appointments count with filters applied
    const totalAppointments = await Appointment.countDocuments(filter);
    const totalPages = Math.ceil(totalAppointments / pageSize);

    // Get appointments for current page
    const appointments = await Appointment.find(filter)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("patient");

    // Stats calculations
    const confirmAppointments = appointments.filter((a) => a.status.toLowerCase() === "confirmed").length;
    const pendingAppointments = appointments.filter((a) => a.status.toLowerCase() === "pending").length;
    const completedAppointments = appointments.filter((a) => a.status.toLowerCase() === "completed").length;
    const cancelAppointments = appointments.filter((a) => a.status.toLowerCase() === "cancelled").length;

    // Quick stats for today, week, month
    const todaysAppointments = await Appointment.countDocuments({
      date: { $gte: moment().startOf("day").toDate(), $lte: moment().endOf("day").toDate() }
    });

    const weekAppointments = await Appointment.countDocuments({
      date: { $gte: moment().startOf("week").toDate(), $lte: moment().endOf("week").toDate() }
    });

    const monthAppointments = await Appointment.countDocuments({
      date: { $gte: moment().startOf("month").toDate(), $lte: moment().endOf("month").toDate() }
    });

    res.render("appointment", {
      title: "Appointments Management",
      appointments,
      user: req.user,
      confirmAppointments,
      pendingAppointments,
      completedAppointments,
      cancelAppointments,
      totalPages,
      currentPage: parseInt(page),
      todaysAppointments,
      weekAppointments,
      monthAppointments,
      searchTerm: search || '',
      selectedStatus: status || '',
      selectedDepartment: department || '',
      selectedDate: date || ''
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
    const { search, status, category, page = 1 } = req.query; // Get filters and page from query params
    const pageSize = 10; // Number of items per page

    let filter = {};
    // Filter by name (search term)
    if (search) {
      filter.name = { $regex: search, $options: 'i' }; // Case-insensitive search
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Calculate the total number of items
    const totalItems = await Inventory.countDocuments(filter);

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalItems / pageSize);

    // Fetch the items for the current page
    const inventory = await Inventory.find(filter)
      .skip((page - 1) * pageSize)  // Skip the previous pages
      .limit(pageSize)  // Limit the number of items returned

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
      totalPages, // Pass total pages to the template
      currentPage: parseInt(page), // Pass current page to the template
      searchTerm: search || '',
      selectedStatus: status || '',
      selectedCategory: category || '',
      title: "Inventory Management",
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
        const { search, bedType, department } = req.query;

        // Build the filter criteria based on query parameters
        const filter = {};
        
        if (bedType) {
            filter.status = bedType; // Filter by bed status
        }

        if (department) {
            filter.department = department; // Filter by department
        }

        if (search) {
            // If there's a search term, match it against bedId, ward, room, or patient's name
            filter.$or = [
                { bedId: { $regex: search, $options: 'i' } },
                { ward: { $regex: search, $options: 'i' } },
                { room: { $regex: search, $options: 'i' } },
                { 'patient.name': { $regex: search, $options: 'i' } }
            ];
        }

        // Fetch the beds with the applied filter
        const beds = await Bed.find(filter);
        
        // Fetch unique departments for the department filter dropdown
        const departments = await Bed.distinct('department');

        // Render the view with the filtered beds and departments
        res.render('bed-managemnt', {
            beds,
            departments,
            searchTerm: search || '', // Pass the search term to keep the input field filled
            bedType,
            selectedDepartment: department || '',
            title: "Bed Management",
            user: req.user
        });
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

router.get('/opd', ensureAuthenticated, checkRoles(['admin', 'doctor']), async (req, res) => {
    try {
        const { search, department, status } = req.query;

        // Constructing filter criteria based on query params
        const filter = {};

        // Search by patient name or token ID
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { tokenId: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by department
        if (department) {
            filter.department = department;
        }

        // Filter by status
        if (status) {
            filter.status = status;
        }

        // Fetch patients from the database
        let patients = await Queue.find(filter);

        // Fetch distinct departments for the department filter dropdown
        const departments = await Queue.distinct('department');

        res.render('opd.ejs', {
            patients,
            title: 'OPD Management',
            user: req.user,
            searchTerm: search || '',
            selectedDepartment: department || '',
            status: status || '',
            departments
        });

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
  res.render("emergency", { title: "Emergency Admissions" , user: req.user, status: req.query.status});
});


router.post('/emergency', async (req, res) => {
  const { name, age, gender, contactNumber, chiefComplaint, vitals, referringDoctor } = req.body;

  try {
    const newEmergency = new Emergency({
      name,
      age,
      gender,
      contactNumber,
      chiefComplaint,
      vitals,
      referringDoctor,
    });

    await newEmergency.save();

    res.redirect('/admin/emergency?status=success');
    res.status(201).json({ message: 'Patient registered successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Error registering patient', error: err.message });
  }
});



module.exports = router;
