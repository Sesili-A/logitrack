const mongoose = require("mongoose");

// Construction/work sites managed by the contractor
const siteSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true }, // Removed unique: true for multi-tenancy
  description: { type: String, default: "" },
  active:      { type: Boolean, default: true },
  adminId:     { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }, // Added for multi-tenancy
}, { timestamps: true });

module.exports = mongoose.model("Site", siteSchema);
