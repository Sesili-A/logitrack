const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  date:   { type: Date, required: true },
  status: {
    type: String,
    enum: ["Present", "Absent", "Half-Day", "Overtime"],
    required: true,
  },
  // Site where the worker was deployed that day (optional — absent workers have none)
  site:     { type: String, default: null },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  remarks:  String,
  adminId:  { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }, // Added for multi-tenancy
}, { timestamps: true });

module.exports = mongoose.model("Attendance", attendanceSchema);