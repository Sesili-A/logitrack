const Site = require("../models/Site");

exports.getSites = async (req, res) => {
  try {
    const sites = await Site.find({ active: true, adminId: req.user.id }).sort({ name: 1 });
    res.json(sites);
  } catch (err) { res.status(500).json(err); }
};

exports.getAllSites = async (req, res) => {
  try {
    const sites = await Site.find({ adminId: req.user.id }).sort({ name: 1 });
    res.json(sites);
  } catch (err) { res.status(500).json(err); }
};

exports.createSite = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ msg: "Site name is required" });
    const exists = await Site.findOne({ name: name.trim(), adminId: req.user.id });
    if (exists) return res.status(400).json({ msg: "A site with this name already exists" });
    const site = await Site.create({ name: name.trim(), description: description || "", adminId: req.user.id });
    res.json(site);
  } catch (err) { res.status(500).json(err); }
};

exports.updateSite = async (req, res) => {
  try {
    const { name, description, active } = req.body;
    const newName = name?.trim();
    
    const site = await Site.findOne({ _id: req.params.id, adminId: req.user.id });
    if (!site) return res.status(404).json({ msg: "Site not found" });

    const oldName = site.name;
    
    site.name = newName;
    site.description = description;
    site.active = active;
    await site.save();

    // Cascade name update to all past attendance records
    if (oldName !== newName) {
      const Attendance = require("../models/Attendance");
      await Attendance.updateMany(
        { site: oldName, adminId: req.user.id },
        { $set: { site: newName } }
      );
    }
    
    res.json(site);
  } catch (err) { res.status(500).json(err); }
};

exports.deleteSite = async (req, res) => {
  try {
    await Site.findOneAndDelete({ _id: req.params.id, adminId: req.user.id });
    res.json({ msg: "Site deleted" });
  } catch (err) { res.status(500).json(err); }
};
