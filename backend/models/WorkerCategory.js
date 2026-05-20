const mongoose = require("mongoose");

const workerCategorySchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true } // Multi-tenancy
}, { timestamps: true });

module.exports = mongoose.model("WorkerCategory", workerCategorySchema);
