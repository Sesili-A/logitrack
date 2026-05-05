require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Attendance = require("./models/Attendance");

async function fix() {
  await connectDB();
  const res = await Attendance.updateMany(
    { site: "Asif" },
    { $set: { site: "Asif Er Jayamurugan" } }
  );
  console.log(`Merged ${res.modifiedCount} old attendance records from 'Asif' to 'Asif Er Jayamurugan'.`);
  process.exit(0);
}

fix();
