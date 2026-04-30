const Employee = require("../models/Employee");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");

// Register (admin creation only)
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await Employee.findOne({ email });
    if (exists) return res.status(400).json({ msg: "User exists" });
    const hashed = await bcrypt.hash(password, 10);
    const user   = await Employee.create({ name, email, password: hashed, role });
    res.json(user);
  } catch (err) { res.status(500).json(err); }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Employee.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
  } catch (err) { res.status(500).json(err); }
};

// Get current admin profile
exports.getProfile = async (req, res) => {
  try {
    const user = await Employee.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) { res.status(500).json(err); }
};

// Update admin profile (name, phone)
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name?.trim()) return res.status(400).json({ msg: "Name is required" });
    const user = await Employee.findByIdAndUpdate(
      req.user.id,
      { name: name.trim(), phone: phone?.trim() || null },
      { new: true }
    ).select("-password");
    res.json(user);
  } catch (err) { res.status(500).json(err); }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await Employee.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Current password is incorrect" });
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ msg: "Password updated successfully" });
  } catch (err) { res.status(500).json(err); }
};