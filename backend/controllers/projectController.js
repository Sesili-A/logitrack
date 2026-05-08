const Project        = require("../models/Project");
const ProjectExpense = require("../models/ProjectExpense");


const adminId = req => req.user.id;

// ── Projects ────────────────────────────────────────────────────────────────

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ adminId: adminId(req) }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) { res.status(500).json(err); }
};

exports.createProject = async (req, res) => {
  try {
    const { siteName, description, startDate, endDate, status } = req.body;
    if (!siteName) return res.status(400).json({ msg: "siteName required" });
    const project = await Project.create({
      name:        siteName,
      siteName,
      description: description || "",
      startDate:   new Date(startDate),
      endDate:     endDate ? new Date(endDate) : null,
      status:      status || "active",
      adminId:     adminId(req),
    });
    res.status(201).json(project);
  } catch (err) { res.status(500).json(err); }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, adminId: adminId(req) },
      req.body,
      { new: true }
    );
    if (!project) return res.status(404).json({ msg: "Project not found" });
    res.json(project);
  } catch (err) { res.status(500).json(err); }
};

exports.deleteProject = async (req, res) => {
  try {
    await Project.findOneAndDelete({ _id: req.params.id, adminId: adminId(req) });
    await ProjectExpense.deleteMany({ project: req.params.id, adminId: adminId(req) });
    res.json({ msg: "Deleted" });
  } catch (err) { res.status(500).json(err); }
};

// ── Project detail: just project info + payment notes ────────────────────────

exports.getProjectDetail = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, adminId: adminId(req) });
    if (!project) return res.status(404).json({ msg: "Not found" });

    const expenses = await ProjectExpense.find({
      project: project._id,
      adminId: adminId(req),
    }).sort({ date: -1 });

    const totalReceived = expenses.reduce((s, e) => s + e.amount, 0);

    res.json({ project, expenses, totalReceived: Math.round(totalReceived) });
  } catch (err) { res.status(500).json(err); }
};

// ── Expenses ─────────────────────────────────────────────────────────────────

exports.getExpenses = async (req, res) => {
  try {
    const { projectId } = req.params;
    const expenses = await ProjectExpense.find({ project: projectId, adminId: adminId(req) }).sort({ date: -1 });
    res.json(expenses);
  } catch (err) { res.status(500).json(err); }
};

exports.addExpense = async (req, res) => {
  try {
    const { amount, note, date } = req.body;
    if (!amount || !date) return res.status(400).json({ msg: "amount and date required" });
    const expense = await ProjectExpense.create({
      project: req.params.projectId,
      amount:  Number(amount),
      note:    note || "",
      date:    new Date(date),
      adminId: adminId(req),
    });
    res.status(201).json(expense);
  } catch (err) { res.status(500).json(err); }
};

exports.deleteExpense = async (req, res) => {
  try {
    await ProjectExpense.findOneAndDelete({ _id: req.params.expenseId, adminId: adminId(req) });
    res.json({ msg: "Deleted" });
  } catch (err) { res.status(500).json(err); }
};
