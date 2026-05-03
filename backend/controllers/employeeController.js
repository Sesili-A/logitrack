const Employee = require("../models/Employee");

// Helper — get Monday of a given date
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get all workers (role = employee)
exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ role: "employee" })
      .select("-password")
      .sort({ name: 1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json(err);
  }
};

// Add a worker — no password needed (workers don't log in)
exports.createEmployee = async (req, res) => {
  try {
    const { name, phone, dailyWage } = req.body;

    if (!name || !name.trim())
      return res.status(400).json({ msg: "Name is required" });

    const emp = await Employee.create({
      name:      name.trim(),
      phone:     phone?.trim() || null,
      dailyWage: Number(dailyWage) || 0,
      role:      "employee",
    });

    res.json(emp);
  } catch (err) {
    res.status(500).json({ msg: err.message || "Failed to create worker", err });
  }
};

// Update worker details
exports.updateEmployee = async (req, res) => {
  try {
    const { name, phone, dailyWage } = req.body;

    const emp = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        name:      name?.trim(),
        phone:     phone?.trim() || null,
        dailyWage: Number(dailyWage) || 0,
      },
      { new: true }
    ).select("-password");

    if (!emp) return res.status(404).json({ msg: "Employee not found" });
    res.json(emp);
  } catch (err) {
    res.status(500).json(err);
  }
};

// Delete worker
exports.deleteEmployee = async (req, res) => {
  try {
    const emp = await Employee.findByIdAndDelete(req.params.id);
    if (!emp) return res.status(404).json({ msg: "Employee not found" });
    res.json({ msg: "Employee deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
};