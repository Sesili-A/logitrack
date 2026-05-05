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
    const site = await Site.findOneAndUpdate(
      { _id: req.params.id, adminId: req.user.id },
      { name: name?.trim(), description, active },
      { new: true }
    );
    if (!site) return res.status(404).json({ msg: "Site not found" });
    res.json(site);
  } catch (err) { res.status(500).json(err); }
};

exports.deleteSite = async (req, res) => {
  try {
    await Site.findOneAndDelete({ _id: req.params.id, adminId: req.user.id });
    res.json({ msg: "Site deleted" });
  } catch (err) { res.status(500).json(err); }
};
