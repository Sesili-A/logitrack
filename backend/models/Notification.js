const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  title:   { type: String, required: true },
  message: { type: String, required: true },
  read:    { type: Boolean, default: false },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }, // Specific to an admin
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
