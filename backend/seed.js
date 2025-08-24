const mongoose = require('mongoose');
const Doctor = require('./models/Doctors');

require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI; // update this

const departments = [
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Dermatology',
    'Psychiatry',
    'Gynecology',
    'Urology',
    'Oncology',
    'Gastroenterology'
];

const names = [
    'Dr. Ayesha Malik',
    'Dr. Amir Khan',
    'Dr. Fatima Zahra',
    'Dr. Hamza Ali',
    'Dr. Sana Sheikh',
    'Dr. Bilal Rizvi',
    'Dr. Zara Hussain',
    'Dr. Usman Ghani',
    'Dr. Hina Khalid',
    'Dr. Ahmed Raza'
];

const qualifications = [
    'MBBS, FCPS',
    'MBBS, MD',
    'MBBS, MRCP',
    'MBBS, MS',
    'MBBS, DNB'
];

const getRandomElement = arr => arr[Math.floor(Math.random() * arr.length)];

// Generate random schedule for next 3 days
function generateSchedule() {
    const schedule = {};
    const today = new Date();

    for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const key = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD

        const slots = ['09:00', '10:30', '12:00', '14:00', '15:30'];
        // Randomly select 2–4 slots
        schedule[key] = slots.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 2);
    }

    return schedule;
}

async function seedDoctors() {
    try {
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

        await Doctor.deleteMany(); // clear existing
        console.log('Old doctors removed');

        const doctors = [];

        for (let i = 0; i < 10; i++) {
            doctors.push({
                name: names[i],
                qualifications: getRandomElement(qualifications),
                department: departments[i],
                schedule: generateSchedule(),
                status: 'Available'
            });
        }

        await Doctor.insertMany(doctors);
        console.log('10 doctors seeded successfully');

        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding doctors:', error);
    }
}

seedDoctors();
