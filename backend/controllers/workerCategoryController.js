const WorkerCategory = require("../models/WorkerCategory");
const Employee = require("../models/Employee");

// Get all worker categories for the logged-in admin
exports.getCategories = async (req, res) => {
  try {
    const categories = await WorkerCategory.find({ adminId: req.user.id }).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ msg: err.message || "Failed to fetch categories", err });
  }
};

// Create a new worker category
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ msg: "Category name is required" });
    }

    const exists = await WorkerCategory.findOne({ name: name.trim(), adminId: req.user.id });
    if (exists) {
      return res.status(400).json({ msg: "A category with this name already exists" });
    }

    const category = await WorkerCategory.create({
      name: name.trim(),
      adminId: req.user.id
    });

    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ msg: err.message || "Failed to create category", err });
  }
};

// Delete a worker category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await WorkerCategory.findOneAndDelete({ _id: req.params.id, adminId: req.user.id });
    
    if (!category) {
      return res.status(404).json({ msg: "Category not found" });
    }

    // Optional: Reset employee categories that match this category
    await Employee.updateMany(
      { category: category.name, adminId: req.user.id },
      { $set: { category: null } }
    );

    res.json({ msg: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message || "Failed to delete category", err });
  }
};
