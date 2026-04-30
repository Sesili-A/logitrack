const mongoose = require("mongoose");

// Records cash advances given to workers mid-week by the contractor
const advanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  amount:     { type: Number, required: true, min: 1 },
  date:       { type: Date,   default: Date.now },
  note:       { type: String, default: "" },
  weekStart:  { type: Date },   // Monday of the week — for weekly grouping
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
}, { timestamps: true });

module.exports = mongoose.model("Advance", advanceSchema);
