const Attendance = require("../models/Attendance");
const Advance    = require("../models/Advance");
const Employee   = require("../models/Employee");

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Mark Attendance (re-marking is allowed — deletes old records first) ───────
exports.markAttendance = async (req, res) => {
  try {
    const { records, date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    const dayStart   = new Date(targetDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd     = new Date(targetDate); dayEnd.setHours(23, 59, 59, 999);

    await Attendance.deleteMany({ date: { $gte: dayStart, $lte: dayEnd }, adminId: req.user.id });

    const data = records.map(r => ({
      employee: r.employeeId,
      status:   r.status,
      site:     r.site || null,   // site only relevant for Present/Half-Day
      date:     targetDate,
      markedBy: req.user.id,
      adminId:  req.user.id,
    }));

    await Attendance.insertMany(data);
    res.json({ msg: "Attendance saved", count: data.length });
  } catch (err) {
    res.status(500).json(err);
  }
};

// ── Get today's attendance (pre-fills the mark form) ─────────────────────────
exports.getTodayAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const target   = date ? new Date(date) : new Date();
    const dayStart = new Date(target); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(target); dayEnd.setHours(23, 59, 59, 999);

    const records = await Attendance.find({ date: { $gte: dayStart, $lte: dayEnd }, adminId: req.user.id });

    // Return map { employeeId: { status, site } }
    const map = {};
    records.forEach(r => {
      map[r.employee.toString()] = { status: r.status, site: r.site || "" };
    });
    res.json(map);
  } catch (err) {
    res.status(500).json(err);
  }
};

// ── Dashboard Stats ───────────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const weekStart  = getWeekStart(new Date());
    const weekEnd    = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23, 59, 59, 999);

    const totalEmployees = await Employee.countDocuments({ role: "employee", adminId: req.user.id });

    const todayRecords = await Attendance.find({
      date: { $gte: todayStart, $lte: todayEnd },
      adminId: req.user.id
    }).populate("employee", "name");

    const present  = todayRecords.filter(r => r.status === "Present").length;
    const absent   = todayRecords.filter(r => r.status === "Absent").length;
    const halfDay  = todayRecords.filter(r => r.status === "Half-Day").length;
    const overtime = todayRecords.filter(r => r.status === "Overtime").length;

    // Week payroll summary
    const employees    = await Employee.find({ role: "employee", adminId: req.user.id });
    const weekAttend   = await Attendance.find({ date: { $gte: weekStart, $lte: weekEnd }, adminId: req.user.id });
    const weekAdvances = await Advance.find({ date: { $gte: weekStart, $lte: weekEnd }, adminId: req.user.id });

    let weeklyGross = 0, weeklyAdvance = 0, weeklyNet = 0;
    employees.forEach(emp => {
      const att  = weekAttend.filter(a => a.employee.toString() === emp._id.toString());
      const days = att.filter(a => a.status === "Present").length
                 + att.filter(a => a.status === "Half-Day").length * 0.5
                 + att.filter(a => a.status === "Overtime").length * 1.5;
      const gross = days * (emp.dailyWage || 0);
      const adv   = weekAdvances
        .filter(a => a.employee.toString() === emp._id.toString())
        .reduce((s, a) => s + a.amount, 0);
      weeklyGross   += gross;
      weeklyAdvance += adv;
      weeklyNet     += Math.max(0, gross - adv);
    });

    const recentAdvances = await Advance.find({ adminId: req.user.id })
      .populate("employee", "name")
      .sort({ createdAt: -1 }).limit(6);

    const siteDeployments = {};
    todayRecords.forEach(r => {
      if (r.status === "Absent") return; // Absents don't belong to a deployment site usually
      const siteName = r.site ? r.site : "Unassigned";
      if (!siteDeployments[siteName]) siteDeployments[siteName] = [];
      siteDeployments[siteName].push({
        id: r.employee?._id,
        name: r.employee?.name || "Unknown",
        status: r.status
      });
    });

    res.json({
      totalEmployees,
      present, absent, halfDay, overtime,
      attendanceMarked: todayRecords.length > 0,
      weeklyGross:   Math.round(weeklyGross),
      weeklyAdvance: Math.round(weeklyAdvance),
      weeklyNet:     Math.round(weeklyNet),
      recentAdvances: recentAdvances.map(a => ({
        name: a.employee?.name || "Unknown",
        amount: a.amount, date: a.date, note: a.note,
      })),
      siteDeployments,
    });
  } catch (err) { res.status(500).json(err); }
};

// ── Weekly Payroll ────────────────────────────────────────────────────────────
exports.getWeeklyPayroll = async (req, res) => {
  try {
    const { weekStart: qs } = req.query;
    let weekStart;
    if (qs) { weekStart = new Date(qs); weekStart.setHours(0, 0, 0, 0); }
    else    { weekStart = getWeekStart(new Date()); }

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23, 59, 59, 999);

    const employees  = await Employee.find({ role: "employee", adminId: req.user.id }).sort({ name: 1 });
    const attendance = await Attendance.find({ date: { $gte: weekStart, $lte: weekEnd }, adminId: req.user.id });
    const advances   = await Advance.find({ date: { $gte: weekStart, $lte: weekEnd }, adminId: req.user.id });

    const payroll = employees.map(emp => {
      const empAtt = attendance.filter(a => a.employee.toString() === emp._id.toString());

      const presentDays  = empAtt.filter(a => a.status === "Present").length;
      const halfDays     = empAtt.filter(a => a.status === "Half-Day").length;
      const absentDays   = empAtt.filter(a => a.status === "Absent").length;
      const overtimeDays = empAtt.filter(a => a.status === "Overtime").length;
      const effectiveDays = presentDays + halfDays * 0.5 + overtimeDays * 1.5;
      const grossWage     = effectiveDays * (emp.dailyWage || 0);

      const empAdvances  = advances.filter(a => a.employee.toString() === emp._id.toString());
      const totalAdvance = empAdvances.reduce((s, a) => s + a.amount, 0);
      const netPayable   = grossWage - totalAdvance; // allow negative (excess carry-over to next week)
      const carryOver    = netPayable < 0 ? Math.abs(netPayable) : 0;

      // Sites worked this week (unique, with day info)
      const siteDays = empAtt
        .filter(a => a.site && (a.status === "Present" || a.status === "Half-Day" || a.status === "Overtime"))
        .map(a => ({
          date:   a.date,
          site:   a.site,
          status: a.status,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const uniqueSites = [...new Set(siteDays.map(s => s.site))];

      return {
        _id: emp._id, name: emp.name, phone: emp.phone,
        dailyWage: emp.dailyWage || 0,
        presentDays, halfDays, absentDays, overtimeDays,
        effectiveDays, grossWage, totalAdvance, netPayable, carryOver,
        siteDays,
        uniqueSites,
        advanceDetails: empAdvances.map(a => ({
          _id: a._id, amount: a.amount, date: a.date, note: a.note,
        })),
        attendanceMarked: empAtt.length > 0,
      };
    });

    // Build site-wise summary: { siteName: { cost, workerIds, days } }
    const siteStats = {};
    payroll.forEach(p => {
      p.siteDays.forEach(sd => {
        const s = sd.site || "Unassigned";
        if (!siteStats[s]) siteStats[s] = { cost: 0, workerIds: new Set(), days: 0 };
        let dayCost = p.dailyWage;
        if (sd.status === "Half-Day") dayCost *= 0.5;
        if (sd.status === "Overtime") dayCost *= 1.5;
        siteStats[s].cost += dayCost;
        siteStats[s].workerIds.add(p._id.toString());
        siteStats[s].days += 1;
      });
    });
    // Convert Sets to counts for JSON serialisation
    const siteStatsJSON = Object.fromEntries(
      Object.entries(siteStats).map(([k, v]) => [k, { cost: v.cost, workers: v.workerIds.size, days: v.days }])
    );

    res.json({
      weekStart, weekEnd,
      payroll,
      totalGross:   payroll.reduce((s, p) => s + p.grossWage, 0),
      totalAdvance: payroll.reduce((s, p) => s + p.totalAdvance, 0),
      totalNet:     payroll.reduce((s, p) => s + p.netPayable, 0),
      siteStats:    siteStatsJSON,
    });
  } catch (err) { res.status(500).json(err); }
};

// ── Attendance History ────────────────────────────────────────────────────────
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { from, to, employeeId, status, page = 1, limit = 25 } = req.query;
    const filter = { adminId: req.user.id };
    if (from || to) {
      filter.date = {};
      if (from) { const d = new Date(from); d.setHours(0,0,0,0); filter.date.$gte = d; }
      if (to)   { const d = new Date(to);   d.setHours(23,59,59,999); filter.date.$lte = d; }
    }
    if (employeeId && employeeId !== "all") filter.employee = employeeId;
    if (status     && status !== "all")     filter.status   = status;

    const total   = await Attendance.countDocuments(filter);
    const records = await Attendance.find(filter)
      .populate("employee", "name phone dailyWage")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      records: records.map(r => ({
        _id:    r._id,
        name:   r.employee?.name  || "Unknown",
        phone:  r.employee?.phone || "—",
        status: r.status,
        site:   r.site || "—",
        date:   r.date,
      })),
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (err) { res.status(500).json(err); }
};