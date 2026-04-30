const mongoose = require("mongoose");

// Construction/work sites managed by the contractor
const siteSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, unique: true },
  description: { type: String, default: "" },
  active:      { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("Site", siteSchema);
