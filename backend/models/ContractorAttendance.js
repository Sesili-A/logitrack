const mongoose = require("mongoose");

const contractorAttendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  site: { type: String, required: true },
  contractor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contractor",
    required: true
  },
  details: [{
    working: { type: String, required: true },
    count: { type: Number, required: true, default: 0 },
    salary: { type: Number, required: true, default: 0 }
  }],
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("ContractorAttendance", contractorAttendanceSchema);
