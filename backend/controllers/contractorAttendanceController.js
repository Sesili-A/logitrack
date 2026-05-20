const ContractorAttendance = require("../models/ContractorAttendance");
const Contractor = require("../models/Contractor");

// Helper — get Sunday of a given date
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get contractor attendance for a given date
exports.getAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const target = date ? new Date(date) : new Date();
    const dayStart = new Date(target); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(target); dayEnd.setHours(23, 59, 59, 999);

    const records = await ContractorAttendance.find({
      date: { $gte: dayStart, $lte: dayEnd },
      adminId: req.user.id
    }).populate("contractor", "title members");

    res.json(records);
  } catch (err) {
    res.status(500).json({ msg: err.message || "Failed to fetch contractor attendance", err });
  }
};

// Save (upsert) contractor attendance for a date and contractor
exports.saveAttendance = async (req, res) => {
  try {
    const { date, site, contractorId, details } = req.body;

    if (!date) return res.status(400).json({ msg: "Date is required" });
    if (!site || !site.trim()) return res.status(400).json({ msg: "Working site is required" });
    if (!contractorId) return res.status(400).json({ msg: "Contractor task is required" });
    if (!details || !Array.isArray(details)) {
      return res.status(400).json({ msg: "Attendance details must be an array" });
    }

    const targetDate = new Date(date);
    const dayStart = new Date(targetDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(targetDate); dayEnd.setHours(23, 59, 59, 999);

    // Save or update existing attendance for this contractor on this date
    const record = await ContractorAttendance.findOneAndUpdate(
      {
        date: { $gte: dayStart, $lte: dayEnd },
        contractor: contractorId,
        adminId: req.user.id
      },
      {
        date: targetDate,
        site: site.trim(),
        contractor: contractorId,
        details: details.map(d => ({
          working: d.working.trim(),
          count: Math.max(0, Number(d.count) || 0),
          salary: Math.max(0, Number(d.salary) || 0)
        })),
        adminId: req.user.id
      },
      { upsert: true, new: true }
    ).populate("contractor", "title members");

    res.json(record);
  } catch (err) {
    res.status(500).json({ msg: err.message || "Failed to save contractor attendance", err });
  }
};

// Get week-wise gross payroll and daily records
exports.getPayroll = async (req, res) => {
  try {
    const { weekStart: qs } = req.query;
    let weekStart;
    if (qs) {
      weekStart = new Date(qs);
      weekStart.setHours(0, 0, 0, 0);
    } else {
      weekStart = getWeekStart(new Date());
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Fetch all contractor tasks
    const contractors = await Contractor.find({ adminId: req.user.id }).sort({ title: 1 });

    // Fetch all contractor attendance records for the week
    const records = await ContractorAttendance.find({
      date: { $gte: weekStart, $lte: weekEnd },
      adminId: req.user.id
    }).populate("contractor", "title members");

    let totalWeeklyCost = 0;

    const payroll = contractors.map(c => {
      // Find all records this week for this contractor
      const empAtt = records.filter(r => r.contractor && r.contractor._id.toString() === c._id.toString());
      
      let totalGross = 0;
      const days = empAtt.map(r => {
        const dailyTotal = r.details.reduce((sum, item) => sum + (item.count * item.salary), 0);
        totalGross += dailyTotal;
        return {
          _id: r._id,
          date: r.date,
          site: r.site,
          details: r.details,
          dailyTotal
        };
      });

      totalWeeklyCost += totalGross;

      return {
        _id: c._id,
        title: c.title,
        members: c.members,
        totalGross,
        days: days.sort((a, b) => new Date(a.date) - new Date(b.date))
      };
    });

    res.json({
      weekStart,
      weekEnd,
      payroll,
      totalWeeklyCost
    });
  } catch (err) {
    res.status(500).json({ msg: err.message || "Failed to fetch payroll", err });
  }
};
