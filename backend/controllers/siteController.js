const Site = require("../models/Site");

exports.getSites = async (req, res) => {
  try {
    const sites = await Site.find({ active: true }).sort({ name: 1 });
    res.json(sites);
  } catch (err) { res.status(500).json(err); }
};

exports.getAllSites = async (req, res) => {
  try {
    const sites = await Site.find().sort({ name: 1 });
    res.json(sites);
  } catch (err) { res.status(500).json(err); }
};

exports.createSite = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ msg: "Site name is required" });
    const exists = await Site.findOne({ name: name.trim() });
    if (exists) return res.status(400).json({ msg: "A site with this name already exists" });
    const site = await Site.create({ name: name.trim(), description: description || "" });
    res.json(site);
  } catch (err) { res.status(500).json(err); }
};

exports.updateSite = async (req, res) => {
  try {
    const { name, description, active } = req.body;
    const site = await Site.findByIdAndUpdate(
      req.params.id,
      { name: name?.trim(), description, active },
      { new: true }
    );
    if (!site) return res.status(404).json({ msg: "Site not found" });
    res.json(site);
  } catch (err) { res.status(500).json(err); }
};

exports.deleteSite = async (req, res) => {
  try {
    await Site.findByIdAndDelete(req.params.id);
    res.json({ msg: "Site deleted" });
  } catch (err) { res.status(500).json(err); }
};
