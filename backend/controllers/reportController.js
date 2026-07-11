const Attendance = require("../models/Attendance");
const Advance = require("../models/Advance");
const Employee = require("../models/Employee");
const Project = require("../models/Project");
const ProjectExpense = require("../models/ProjectExpense");
const mongoose = require("mongoose");

// Get Employee Yearly Ledger
exports.getEmployeeLedger = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year } = req.query;
    
    if (!year) return res.status(400).json({ msg: "Year is required" });

    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ msg: "Employee not found" });

    // Fetch attendances for the year
    const attendances = await Attendance.find({
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate },
      adminId: req.user.id
    });

    // Fetch advances for the year
    const advances = await Advance.find({
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate },
      adminId: req.user.id
    });

    let ledger = [];
    let runningBalance = 0;

    // Process Attendances (Credit)
    attendances.forEach(att => {
      if (att.status === "Present" || att.status === "Half-Day" || att.status === "Overtime") {
        let earned = 0;
        let wageStr = "Wage";
        
        if (att.status === "Present") {
          earned = employee.dailyWage;
        } else if (att.status === "Half-Day") {
          earned = employee.dailyWage / 2;
          wageStr = "Half-Day Wage";
        } else if (att.status === "Overtime") {
          earned = employee.dailyWage + (att.overtimeHours * (employee.dailyWage / 8));
          wageStr = `Wage + Overtime (${att.overtimeHours}hrs)`;
        }

        ledger.push({
          date: att.date,
          particulars: `${wageStr} - ${att.site || "Unassigned Site"}`,
          credit: earned,
          debit: 0
        });
      }
    });

    // Process Advances (Debit)
    advances.forEach(adv => {
      ledger.push({
        date: adv.date,
        particulars: `Advance - ${adv.site || "Unassigned Site"} ${adv.note ? `(${adv.note})` : ""}`,
        credit: 0,
        debit: adv.amount
      });
    });

    // Sort chronologically
    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    ledger.forEach(entry => {
      runningBalance += (entry.credit - entry.debit);
      entry.balance = runningBalance;
    });

    res.json({
      employee: { name: employee.name, phone: employee.phone, category: employee.category },
      year,
      ledger
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Get Site Yearly Ledger
exports.getSiteLedger = async (req, res) => {
  try {
    const { siteName } = req.params;
    const { year } = req.query;

    if (!year) return res.status(400).json({ msg: "Year is required" });

    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    // Fetch attendances at this site (Debit / Expense)
    const attendances = await Attendance.find({
      site: siteName,
      date: { $gte: startDate, $lte: endDate },
      adminId: req.user.id
    }).populate("employee", "name dailyWage");

    // Fetch advances given at this site (Debit / Expense)
    const advances = await Advance.find({
      site: siteName,
      date: { $gte: startDate, $lte: endDate },
      adminId: req.user.id
    }).populate("employee", "name");

    // Fetch projects at this site to get project expenses (Credit / Income)
    const projects = await Project.find({ siteName, adminId: req.user.id });
    const projectIds = projects.map(p => p._id);

    const projectExpenses = await ProjectExpense.find({
      project: { $in: projectIds },
      date: { $gte: startDate, $lte: endDate },
      adminId: req.user.id
    }).populate("project", "name");

    let ledger = [];
    let runningBalance = 0; // For a site, balance = Income - Expenses

    // Process Attendances
    attendances.forEach(att => {
      if (!att.employee) return;
      if (att.status === "Present" || att.status === "Half-Day" || att.status === "Overtime") {
        let expense = 0;
        let wageStr = "Wage";
        const dailyWage = att.employee.dailyWage || 0;

        if (att.status === "Present") {
          expense = dailyWage;
        } else if (att.status === "Half-Day") {
          expense = dailyWage / 2;
          wageStr = "Half-Day Wage";
        } else if (att.status === "Overtime") {
          expense = dailyWage + (att.overtimeHours * (dailyWage / 8));
          wageStr = `Wage + Overtime`;
        }

        ledger.push({
          date: att.date,
          particulars: `${wageStr} for ${att.employee.name}`,
          credit: 0,
          debit: expense
        });
      }
    });

    // Process Advances
    advances.forEach(adv => {
      if (!adv.employee) return;
      ledger.push({
        date: adv.date,
        particulars: `Advance paid to ${adv.employee.name}`,
        credit: 0,
        debit: adv.amount
      });
    });

    // Process Project Expenses (Income)
    projectExpenses.forEach(pe => {
      ledger.push({
        date: pe.date,
        particulars: `Payment Received for Project: ${pe.project.name} ${pe.note ? `(${pe.note})` : ""}`,
        credit: pe.amount,
        debit: 0
      });
    });

    // Sort chronologically
    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    ledger.forEach(entry => {
      runningBalance += (entry.credit - entry.debit);
      entry.balance = runningBalance;
    });

    res.json({
      siteName,
      year,
      ledger
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Get Project Yearly Ledger
exports.getProjectLedger = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { year } = req.query;

    if (!year) return res.status(400).json({ msg: "Year is required" });

    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ msg: "Project not found" });

    const projectExpenses = await ProjectExpense.find({
      project: projectId,
      date: { $gte: startDate, $lte: endDate },
      adminId: req.user.id
    });

    let ledger = [];
    let runningBalance = 0;

    projectExpenses.forEach(pe => {
      ledger.push({
        date: pe.date,
        particulars: `Payment Received ${pe.note ? `(${pe.note})` : ""}`,
        credit: pe.amount,
        debit: 0
      });
    });

    // Sort
    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate
    ledger.forEach(entry => {
      runningBalance += entry.credit;
      entry.balance = runningBalance;
    });

    res.json({
      project: { name: project.name, siteName: project.siteName },
      year,
      ledger
    });
  } catch (err) {
    res.status(500).json(err);
  }
};
