const mongoose = require("mongoose");

const contractorMemberSchema = new mongoose.Schema({
  working: { type: String, required: true, trim: true }, // e.g. "Carpenter", "Helper"
  salary:  { type: Number, required: true, default: 0 }   // Daily wage or rate
});

const contractorSchema = new mongoose.Schema({
  title:   { type: String, required: true, trim: true }, // e.g. "Carpenter", "Bar Bender"
  members: [contractorMemberSchema],
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true } // Multi-tenancy
}, { timestamps: true });

module.exports = mongoose.model("Contractor", contractorSchema);
