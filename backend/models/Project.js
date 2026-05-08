const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  siteName:    { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, default: null },
  status:      { type: String, enum: ["active", "completed", "paused"], default: "active" },
  adminId:     { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);
