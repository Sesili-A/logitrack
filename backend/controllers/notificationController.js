const Notification = require("../models/Notification");
const Employee = require("../models/Employee");
const webpush = require("web-push");

// Define VAPID keys (in a real app, these should be in .env)
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuB-5S2P54bpZebB2r8M0P7L8I";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "H4mR8D9mP-L_3Aov_tKIf1R8xR-AOM41gWbZzF_9B8k";

webpush.setVapidDetails(
  "mailto:test@example.com",
  publicVapidKey,
  privateVapidKey
);

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

// Send VAPID public key to client
exports.getVapidPublicKey = (req, res) => {
  res.json({ publicKey: publicVapidKey });
};

// Subscribe user to push notifications
exports.subscribeToPush = async (req, res) => {
  try {
    const subscription = req.body;
    // Find the admin user and add subscription if it doesn't exist
    const admin = await Employee.findById(req.user.id);
    if (!admin) return res.status(404).json({ msg: "User not found" });

    // Prevent duplicate subscriptions
    const exists = admin.pushSubscriptions?.some(sub => sub.endpoint === subscription.endpoint);
    
    if (!exists) {
      if (!admin.pushSubscriptions) admin.pushSubscriptions = [];
      admin.pushSubscriptions.push(subscription);
      await admin.save();
    }
    res.status(201).json({ msg: "Subscribed successfully" });
  } catch (err) { res.status(500).json(err); }
};

// Helper function to send push notification to all admins
exports.sendPushToAdmins = async (payload) => {
  try {
    const admins = await Employee.find({ role: "admin" });
    for (const admin of admins) {
      if (admin.pushSubscriptions && admin.pushSubscriptions.length > 0) {
        for (const sub of admin.pushSubscriptions) {
          try {
            await webpush.sendNotification(sub, JSON.stringify(payload));
          } catch (e) {
            console.error("Push error (possibly expired):", e.statusCode);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error fetching admins for push:", err);
  }
};

// Test push notification
exports.testPush = async (req, res) => {
  try {
    await exports.sendPushToAdmins({
      title: "Test Notification 🚀",
      body: "Your push notifications are working perfectly!",
      icon: "/logo.png"
    });
    res.json({ msg: "Push sent!" });
  } catch (err) {
    res.status(500).json(err);
  }
};
