const mongoose = require('mongoose');

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const DB_URI = process.env.MONGODB_URI;

async function runDebug() {
  try {
    await mongoose.connect(DB_URI);
    
    // Find Mayur
    const Doctor = mongoose.model('Doctor', new mongoose.Schema({
      firstName: String, lastName: String, available: Object, availableDays: Array, availableTime: String, sessionTime: String
    }), 'doctors');
    
    const doctor = await Doctor.findOne({ firstName: /mayur/i });
    if (!doctor) {
      console.log("NOT_FOUND: Doctor Mayur Patil not found");
      process.exit(0);
    }

    console.log("DOCTOR_ID:", doctor._id);
    console.log("DAYS_NESTED:", JSON.stringify(doctor.available?.days));
    console.log("DAYS_FLAT:", JSON.stringify(doctor.availableDays));
    console.log("TIME_NESTED:", doctor.available?.time);
    console.log("TIME_FLAT:", doctor.availableTime);
    console.log("SESSION_TIME:", doctor.sessionTime);

    // Test a specific date: 2026-04-21 (Tuesday)
    const targetDate = new Date("2026-04-21");
    targetDate.setHours(0,0,0,0);
    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    console.log("TESTING_FOR:", targetDate.toISOString(), "Day:", dayName);

    const workingDays = doctor.available?.days || doctor.availableDays || [];
    const isWorking = workingDays.some(d => d.toLowerCase() === dayName.toLowerCase());
    console.log("IS_WORKING_DAY:", isWorking);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

runDebug();
