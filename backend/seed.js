// // seedOpdQueue.js
// const mongoose = require("mongoose");
// const OPDQueue = require("./models/Opd"); // adjust path if needed

// // MongoDB connection string
// const MONGO_URI = "mongodb+srv://autenic123:Autenic%402023@cluster0.ffahpwv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // change db name if needed

// // Sample data arrays
// const departments = ["Cardiology", "Dermatology", "Neurology", "Pediatrics", "Orthopedics"];
// const doctors = [
//   { name: "Dr. Ajay Yadav", department: "Cardiology" },
//   { name: "Dr. Dev Yadav", department: "Dermatology" },
//   { name: "Dr. Angraj", department: "Neurology" },
//   { name: "Dr. Deva", department: "Pediatrics" },
//   { name: "Dr. Azaad", department: "Orthopedics" }
// ];
// const statuses = ["waiting", "consulting", "called", "completed", "cancelled"];
// const firstNames = ["Aarav", "Ishaan", "Riya", "Anaya", "Kabir", "Vihaan", "Sara", "Mira", "Karan", "Priya"];
// const lastNames = ["Sharma", "Verma", "Patel", "Reddy", "Nair", "Mehta", "Chopra", "Bose", "Gupta", "Singh"];

// // Random helper
// const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
// const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// async function seedData() {
//   try {
//     await mongoose.connect(MONGO_URI);
//     console.log("✅ Connected to MongoDB");

//     // Clear old data
//     await OPDQueue.deleteMany({});
//     console.log("🗑 Old OPDQueue data cleared");

//     const records = [];

//     for (let i = 1; i <= 50; i++) {
//       const dept = randomItem(departments);
//       const doc = doctors.find((d) => d.department === dept);

//       records.push({
//         tokenNumber: String(i).padStart(3, "0"),
//         patient: {
//           name: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
//           age: randomInt(18, 75),
//           gender: randomItem(["Male", "Female", "Other"]),
//           contact: `+91${randomInt(6000000000, 9999999999)}`
//         },
//         department: dept,
//         doctor: { name: doc.name },
//         status: randomItem(statuses),
//         waitTime: randomInt(5, 60), // in minutes
//         appointmentTime: new Date(),
//         checkInTime: new Date(Date.now() - randomInt(5, 120) * 60000) // random check-in in last 2 hours
//       });
//     }

//     await OPDQueue.insertMany(records);
//     console.log("✅ 50 OPDQueue records inserted");

//     mongoose.connection.close();
//   } catch (err) {
//     console.error("❌ Error seeding data:", err);
//     mongoose.connection.close();
//   }
// }

// seedData();


// // seedAppointments.js
// const mongoose = require("mongoose");
// const Appointment = require("./models/Appointment"); // adjust path if needed

// // MongoDB connection string
// // const MONGO_URI = "mongodb://127.0.0.1:27017/hospitaldb"; // change db name if needed

// // Sample data
// const departments = ["Cardiology", "Dermatology", "Neurology", "Pediatrics", "Orthopedics"];
// const doctors = [
//   "Dr. John Smith",
//   "Dr. Emily Brown",
//   "Dr. Alex Lee",
//   "Dr. Sarah Johnson",
//   "Dr. David Wilson"
// ];
// const statuses = ["Pending", "Confirmed", "Completed", "Cancelled"];
// const times = [
//   "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
//   "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
//   "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM"
// ];

// // Random helpers
// const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
// const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// // Dummy patient IDs (replace with real user IDs if available)
// const patientIds = Array.from({ length: 10 }, () => new mongoose.Types.ObjectId());

// async function seedData() {
//   try {
//     await mongoose.connect(MONGO_URI);
//     console.log("✅ Connected to MongoDB");

//     await Appointment.deleteMany({});
//     console.log("🗑 Old Appointment data cleared");

//     const records = [];

//     for (let i = 0; i < 50; i++) {
//       const department = randomItem(departments);
//       const doctor = randomItem(doctors);

//       records.push({
//         patient: randomItem(patientIds), // random patient from dummy list
//         doctor: doctor,
//         department: department,
//         date: new Date(Date.now() + randomInt(-5, 5) * 24 * 60 * 60 * 1000), // ±5 days from today
//         time: randomItem(times),
//         status: randomItem(statuses)
//       });
//     }

//     await Appointment.insertMany(records);
//     console.log("✅ 50 Appointment records inserted");

//     mongoose.connection.close();
//   } catch (err) {
//     console.error("❌ Error seeding data:", err);
//     mongoose.connection.close();
//   }
// }

// seedData();



// // seedAdmissions.js
// const mongoose = require("mongoose");
// const Admission = require("./models/Admission"); // adjust path if needed

// // const MONGO_URI = "mongodb://127.0.0.1:27017/hospitaldb"; // change as needed

// // Sample data
// const genders = ["Male", "Female", "Other"];
// const departments = ["Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Dermatology"];
// const doctors = [
//   "Dr. John Smith",
//   "Dr. Emily Brown",
//   "Dr. Alex Lee",
//   "Dr. Sarah Johnson",
//   "Dr. David Wilson"
// ];

// // Example Cloudinary links (replace with your own if needed)
// const documentLinks = [
//   "https://res.cloudinary.com/demo/image/upload/sample.jpg",
//   "https://res.cloudinary.com/demo/image/upload/v1690012345/report1.png",
//   "https://res.cloudinary.com/demo/image/upload/v1690012345/report2.jpg"
// ];

// // Random helpers
// const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
// const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
// const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
// const randomPhone = () => "+91" + randomInt(6000000000, 9999999999).toString();
// const randomName = () => {
//   const firstNames = ["Aarav", "Vivaan", "Aditya", "Ishaan", "Kabir", "Ananya", "Diya", "Ira", "Meera", "Riya"];
//   const lastNames = ["Sharma", "Verma", "Patel", "Singh", "Gupta", "Kumar", "Agarwal", "Bose", "Reddy", "Das"];
//   return `${randomItem(firstNames)} ${randomItem(lastNames)}`;
// };
// const randomEmail = (name) => {
//   const domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];
//   return `${name.toLowerCase().replace(" ", ".")}@${randomItem(domains)}`;
// };

// // Dummy user IDs
// const userIds = Array.from({ length: 10 }, () => new mongoose.Types.ObjectId());

// async function seedAdmissions() {
//   try {
//     await mongoose.connect(MONGO_URI);
//     console.log("✅ Connected to MongoDB");

//     await Admission.deleteMany({});
//     console.log("🗑 Cleared old admissions");

//     const admissions = [];

//     for (let i = 0; i < 50; i++) {
//       const name = randomName();
//       admissions.push({
//         userId: randomItem(userIds),
//         fullName: name,
//         dateOfBirth: randomDate(new Date(1960, 0, 1), new Date(2010, 0, 1)),
//         gender: randomItem(genders),
//         contactNumber: randomPhone(),
//         emailAddress: randomEmail(name),
//         address: `${randomInt(100, 999)}, ${randomItem(["MG Road", "Park Street", "Ring Road", "Civil Lines", "Main Street"])}, ${randomItem(["Delhi", "Mumbai", "Bangalore", "Kolkata", "Hyderabad"])}`,
//         currentMedications: randomItem(["None", "Paracetamol", "Metformin", "Lisinopril"]),
//         knownAllergies: randomItem(["None", "Peanuts", "Penicillin", "Dust"]),
//         pastConditions: randomItem(["None", "Asthma", "Diabetes", "Hypertension"]),
//         department: randomItem(departments),
//         preferredDoctor: randomItem(doctors),
//         preferredDate: randomDate(new Date(), new Date(2025, 11, 31)),
//         preferredTime: `${randomInt(9, 17)}:${randomItem(["00", "30"])}`,
//         emergencyCase: Math.random() > 0.7,
//         documents: [randomItem(documentLinks)], // Random real image link
//         createdAt: new Date()
//       });
//     }

//     await Admission.insertMany(admissions);
//     console.log("✅ 50 Admissions inserted successfully");

//     mongoose.connection.close();
//   } catch (err) {
//     console.error("❌ Error seeding admissions:", err);
//     mongoose.connection.close();
//   }
// }

// seedAdmissions();



// // seedBeds.js
// const mongoose = require("mongoose");
// const Bed = require("./models/Bed"); // adjust path if needed

// // const MONGO_URI = "mongodb://127.0.0.1:27017/hospitaldb"; // change to your DB

// // Sample data
// const wards = ["A", "B", "C", "ICU", "Emergency", "General"];
// const doctors = [
//   "Dr. Ajay Smith",
//   "Dr. Dev Brown",
//   "Dr. Deva Lee",
//   "Dr. Angraj Johnson",
//   "Dr. David Wilson"
// ];
// const conditions = [
//   "Stable",
//   "Critical",
//   "Under Observation",
//   "Recovering",
//   "Post-Surgery"
// ];

// const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
// const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
// const randomDate = (start, end) =>
//   new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// const randomName = () => {
//   const firstNames = ["Aarav", "Vivaan", "Aditya", "Ishaan", "Kabir", "Ananya", "Diya", "Ira", "Meera", "Riya"];
//   const lastNames = ["Sharma", "Verma", "Patel", "Singh", "Gupta", "Kumar", "Agarwal", "Bose", "Reddy", "Das"];
//   return `${randomItem(firstNames)} ${randomItem(lastNames)}`;
// };

// async function seedBeds() {
//   try {
//     await mongoose.connect(MONGO_URI);
//     console.log("✅ Connected to MongoDB");

//     await Bed.deleteMany({});
//     console.log("🗑 Old beds data cleared");

//     const beds = [];

//     for (let i = 1; i <= 50; i++) {
//       const status = Math.random() > 0.5 ? "occupied" : "available";
//       let patientData = {};
//       let admitDate = null;
//       let dischargeDate = null;
//       let doctorName = null;
//       let conditionStatus = null;

//       if (status === "occupied") {
//         patientData = {
//           name: randomName(),
//           id: `P-${randomInt(1000, 9999)}`
//         };
//         doctorName = randomItem(doctors);
//         conditionStatus = randomItem(conditions);
//         admitDate = randomDate(new Date(2025, 0, 1), new Date());
//         dischargeDate = Math.random() > 0.7 ? randomDate(admitDate, new Date()) : null; // 30% chance discharged
//       }

//       beds.push({
//         bedId: `B-${i}`,
//         ward: randomItem(wards),
//         floor: `Floor-${randomInt(1, 5)}`,
//         room: `Room-${randomInt(101, 150)}`,
//         status,
//         patient: patientData,
//         doctor: doctorName,
//         condition: conditionStatus,
//         admitDate,
//         dischargeDate
//       });
//     }

//     await Bed.insertMany(beds);
//     console.log("✅ 50 beds inserted successfully");

//     mongoose.connection.close();
//   } catch (err) {
//     console.error("❌ Error seeding beds:", err);
//     mongoose.connection.close();
//   }
// }

// seedBeds();



// // seedDoctors.js
// const mongoose = require("mongoose");
// const Doctor = require("./models/Doctors"); // adjust path if needed

// // const MONGO_URI = "mongodb://127.0.0.1:27017/hospitaldb"; // change to your DB

// const departments = [
//   "Cardiology",
//   "Orthopedics",
//   "Neurology",
//   "Emergency",
//   "Critical Care",
//   "Dermatology",
//   "ENT",
//   "Pediatrics",
//   "General Medicine",
//   "Oncology"
// ];

// const qualifications = [
//   "MBBS, MD",
//   "MBBS, MS",
//   "MBBS, DM",
//   "MBBS, MCh",
//   "MBBS, DNB",
//   "MBBS, MD, DM"
// ];

// const statuses = ["Available", "Busy", "On Break"];

// const firstNames = [
//   "Ajay",
//   "Vivaan",
//   "Aditya",
//   "Ishaan",
//   "Kabir",
//   "Ananya",
//   "Diya",
//   "Ira",
//   "Meera",
//   "Riya",
//   "Rahul",
//   "Sneha",
//   "Neha",
//   "Arjun",
//   "Siddharth"
// ];
// const lastNames = [
//   "Yadav",
//   "Verma",
//   "Patel",
//   "Singh",
//   "Gupta",
//   "Kumar",
//   "Agarwal",
//   "Bose",
//   "Reddy",
//   "Das"
// ];

// const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
// const randomSlots = () => {
//   const slots = [];
//   const hours = [9, 10, 11, 12, 14, 15, 16, 17]; // Morning & Afternoon slots
//   const mins = ["00", "30"];
//   const count = Math.floor(Math.random() * 5) + 3; // 3 to 7 slots

//   for (let i = 0; i < count; i++) {
//     slots.push(`${randomItem(hours)}:${randomItem(mins)}`);
//   }
//   return [...new Set(slots)]; // ensure unique times
// };

// const randomName = () => `Dr. ${randomItem(firstNames)} ${randomItem(lastNames)}`;

// async function seedDoctors() {
//   try {
//     await mongoose.connect(MONGO_URI);
//     console.log("✅ Connected to MongoDB");

//     await Doctor.deleteMany({});
//     console.log("🗑 Old doctors data cleared");

//     const doctors = [];

//     for (let i = 1; i <= 50; i++) {
//       doctors.push({
//         name: randomName(),
//         qualifications: randomItem(qualifications),
//         department: randomItem(departments),
//         availableSlots: randomSlots(),
//         status: randomItem(statuses)
//       });
//     }

//     await Doctor.insertMany(doctors);
//     console.log("✅ 50 doctors inserted successfully");

//     mongoose.connection.close();
//   } catch (err) {
//     console.error("❌ Error seeding doctors:", err);
//     mongoose.connection.close();
//   }
// }

// seedDoctors();



// // seedInventory.js
// const mongoose = require("mongoose");
// const Inventory = require("./models/Inventory"); // adjust path as needed

// // const MONGO_URI = "mongodb://127.0.0.1:27017/hospitaldb"; // change DB name if needed

// const categories = [
//   "Medicines",
//   "Surgical Supplies",
//   "Medical Equipment",
//   "Lab Supplies",
//   "Protective Gear",
//   "Disposables",
//   "First Aid",
//   "IV Fluids",
//   "Diagnostics",
//   "Cleaning Supplies"
// ];

// const units = ["Box", "Packet", "Bottle", "Piece", "Strip", "Set", "Kit"];

// const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
// const randomStock = () => Math.floor(Math.random() * 200); // stock between 0–199

// // Determine stock status based on stock number
// const getStatus = (stock) => {
//   if (stock === 0) return "Out of Stock";
//   if (stock < 20) return "Low Stock";
//   return "In Stock";
// };

// async function seedInventory() {
//   try {
//     await mongoose.connect(MONGO_URI);
//     console.log("✅ Connected to MongoDB");

//     await Inventory.deleteMany({});
//     console.log("🗑 Old inventory data cleared");

//     const inventoryItems = [];

//     for (let i = 1; i <= 50; i++) {
//       const stock = randomStock();
//       inventoryItems.push({
//         itemId: `INV-${String(i).padStart(4, "0")}`,
//         name: `Item ${i}`,
//         category: randomItem(categories),
//         stock: stock,
//         status: getStatus(stock),
//         unit: randomItem(units),
//         last_updated: new Date(),
//         createdAt: new Date()
//       });
//     }

//     await Inventory.insertMany(inventoryItems);
//     console.log("✅ 50 inventory items inserted successfully");

//     mongoose.connection.close();
//   } catch (err) {
//     console.error("❌ Error seeding inventory:", err);
//     mongoose.connection.close();
//   }
// }

// seedInventory();



// // seedPatients.js
// const mongoose = require("mongoose");
// const Patient = require("./models/Patient"); // adjust path if needed
// const faker = require("faker");

// // const MONGO_URI = "mongodb://127.0.0.1:27017/hospitaldb"; // change as per your DB

// const genders = ["Male", "Female", "Other"];
// const departments = [
//   "Cardiology",
//   "Orthopedics",
//   "Neurology",
//   "Pediatrics",
//   "Dermatology",
//   "ENT",
//   "General Medicine",
//   "Emergency"
// ];
// const doctors = [
//   "Dr. John Smith",
//   "Dr. Emily Johnson",
//   "Dr. Michael Brown",
//   "Dr. Sarah Wilson",
//   "Dr. David Taylor",
//   "Dr. Laura Martinez"
// ];
// const medicines = ["Paracetamol", "Amoxicillin", "Ibuprofen", "Aspirin", "Metformin"];
// const allergies = ["Peanuts", "Dust", "Penicillin", "Pollen", "None"];
// const conditions = ["Hypertension", "Diabetes", "Asthma", "Heart Disease", "None"];

// function randomItem(arr) {
//   return arr[Math.floor(Math.random() * arr.length)];
// }

// async function seedPatients() {
//   try {
//     await mongoose.connect(MONGO_URI);
//     console.log("✅ Connected to MongoDB");

//     await Patient.deleteMany({});
//     console.log("🗑 Old patient data cleared");

//     const patients = [];

//     for (let i = 0; i < 50; i++) {
//       const dob = faker.date.between("1960-01-01", "2015-12-31");
//       const date = faker.date.future();
//       patients.push({
//         fullName: faker.name.findName(),
//         dob: dob,
//         gender: randomItem(genders),
//         contactNumber: faker.phone.phoneNumber(),
//         email: faker.internet.email(),
//         address: faker.address.streetAddress(),
//         medications: randomItem(medicines),
//         allergies: randomItem(allergies),
//         pastConditions: randomItem(conditions),
//         documents: [
//           "https://res.cloudinary.com/demo/image/upload/sample.jpg",
//           "https://res.cloudinary.com/demo/image/upload/hospital_report.jpg"
//         ],
//         department: randomItem(departments),
//         doctor: randomItem(doctors),
//         date: date,
//         time: `${faker.random.number({ min: 9, max: 17 })}:00`,
//         emergency: faker.random.boolean(),
//         createdAt: new Date()
//       });
//     }

//     await Patient.insertMany(patients);
//     console.log("✅ 50 patients inserted successfully");

//     mongoose.connection.close();
//   } catch (err) {
//     console.error("❌ Error seeding patients:", err);
//     mongoose.connection.close();
//   }
// }

// seedPatients();

