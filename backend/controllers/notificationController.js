const Notification = require("../models/Notification");

// Get all notifications
exports.getNotifications = async (req, res) => {
  try {
    const notes = await Notification.find().sort({ createdAt: -1 }).limit(20);
    res.json(notes);
  } catch (err) { res.status(500).json(err); }
};

// Mark as read
exports.markAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ msg: "Marked all as read" });
  } catch (err) { res.status(500).json(err); }
};
