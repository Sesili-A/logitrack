const mongoose = require("mongoose");

// Payment notes: amounts received for a site project, saved with date + optional note
const expenseSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  amount:  { type: Number, required: true },
  note:    { type: String, default: "" },
  date:    { type: Date, required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
}, { timestamps: true });

module.exports = mongoose.model("ProjectExpense", expenseSchema);
