const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  phone:     { type: String, default: null },
  dailyWage: { type: Number, default: 0 },   // ₹ per day — set by contractor

  // Only used for admin login accounts, not for regular workers
  email:    { type: String, default: null, sparse: true, unique: true },
  password: { type: String, default: null },

  role: {
    type: String,
    enum: ["admin", "employee"],
    default: "employee",
  },
}, { timestamps: true });

module.exports = mongoose.model("Employee", employeeSchema);