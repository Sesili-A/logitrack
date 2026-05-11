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
    enum: ["Present", "Absent", "Half-Day", "Overtime", "Holiday"],
    required: true,
  },
  // Site where the worker was deployed that day
  site:         { type: String, default: null },
  // Extra hours worked (only relevant when status === "Overtime")
  overtimeHours: { type: Number, default: 0, min: 0 },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  remarks:  String,
  adminId:  { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }, // Added for multi-tenancy
}, { timestamps: true });

module.exports = mongoose.model("Attendance", attendanceSchema);