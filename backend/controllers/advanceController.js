const Advance  = require("../models/Advance");
const Employee = require("../models/Employee");

// Helper — get Monday of a given date's week
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Add an advance
exports.addAdvance = async (req, res) => {
  try {
    const { employeeId, amount, date, note } = req.body;

    if (!employeeId || !amount)
      return res.status(400).json({ msg: "Employee and amount are required" });

    const advanceDate = date ? new Date(date) : new Date();
    const weekStart   = getWeekStart(advanceDate);

    const advance = await Advance.create({
      employee:   employeeId,
      amount:     Number(amount),
      date:       advanceDate,
      note:       note || "",
      weekStart,
      recordedBy: req.user.id,
    });

    const populated = await Advance.findById(advance._id)
      .populate("employee", "name phone");

    res.json(populated);
  } catch (err) {
    res.status(500).json(err);
  }
};

// Get advances — optionally filtered by date range / employee
exports.getAdvances = async (req, res) => {
  try {
    const { from, to, employeeId } = req.query;
    const filter = {};

    if (from || to) {
      filter.date = {};
      if (from) { const d = new Date(from); d.setHours(0, 0, 0, 0);  filter.date.$gte = d; }
      if (to)   { const d = new Date(to);   d.setHours(23, 59, 59, 999); filter.date.$lte = d; }
    }
    if (employeeId && employeeId !== "all") filter.employee = employeeId;

    const advances = await Advance.find(filter)
      .populate("employee", "name phone")
      .sort({ date: -1 });

    res.json(advances);
  } catch (err) {
    res.status(500).json(err);
  }
};

// Delete an advance
exports.deleteAdvance = async (req, res) => {
  try {
    await Advance.findByIdAndDelete(req.params.id);
    res.json({ msg: "Advance deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
};
