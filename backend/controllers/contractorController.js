const Contractor = require("../models/Contractor");

// Get all contractor tasks for the logged in admin
exports.getContractors = async (req, res) => {
  try {
    const contractors = await Contractor.find({ adminId: req.user.id }).sort({ title: 1 });
    res.json(contractors);
  } catch (err) {
    res.status(500).json({ msg: err.message || "Failed to fetch contractors", err });
  }
};

// Create a new contractor task
exports.createContractor = async (req, res) => {
  try {
    const { title, members } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ msg: "Task title is required" });
    }

    // Validate members if provided
    const formattedMembers = (members || []).map(m => ({
      working: m.working?.trim(),
      salary: Number(m.salary) || 0
    })).filter(m => m.working);

    const contractor = await Contractor.create({
      title: title.trim(),
      members: formattedMembers,
      adminId: req.user.id
    });

    res.status(201).json(contractor);
  } catch (err) {
    res.status(500).json({ msg: err.message || "Failed to create contractor task", err });
  }
};

// Update an existing contractor task
exports.updateContractor = async (req, res) => {
  try {
    const { title, members } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ msg: "Task title is required" });
    }

    const formattedMembers = (members || []).map(m => ({
      working: m.working?.trim(),
      salary: Number(m.salary) || 0
    })).filter(m => m.working);

    const contractor = await Contractor.findOneAndUpdate(
      { _id: req.params.id, adminId: req.user.id },
      {
        title: title.trim(),
        members: formattedMembers
      },
      { new: true }
    );

    if (!contractor) {
      return res.status(404).json({ msg: "Contractor task not found" });
    }

    res.json(contractor);
  } catch (err) {
    res.status(500).json({ msg: err.message || "Failed to update contractor task", err });
  }
};

// Delete a contractor task
exports.deleteContractor = async (req, res) => {
  try {
    const contractor = await Contractor.findOneAndDelete({ _id: req.params.id, adminId: req.user.id });
    
    if (!contractor) {
      return res.status(404).json({ msg: "Contractor task not found" });
    }

    res.json({ msg: "Contractor task deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message || "Failed to delete contractor task", err });
  }
};
