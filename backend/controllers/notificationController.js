const Notification = require("../models/Notification");
const Employee = require("../models/Employee");
const webpush = require("web-push");
const fs = require("fs");
const path = require("path");

// Load or Generate VAPID keys
let publicVapidKey = process.env.VAPID_PUBLIC_KEY;
let privateVapidKey = process.env.VAPID_PRIVATE_KEY;

const vapidPath = path.join(__dirname, '../vapid.json');

if (!publicVapidKey || !privateVapidKey) {
  if (fs.existsSync(vapidPath)) {
    const keys = JSON.parse(fs.readFileSync(vapidPath, 'utf8'));
    publicVapidKey = keys.publicKey;
    privateVapidKey = keys.privateKey;
  } else {
    const keys = webpush.generateVAPIDKeys();
    fs.writeFileSync(vapidPath, JSON.stringify(keys));
    publicVapidKey = keys.publicKey;
    privateVapidKey = keys.privateKey;
  }
}

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
    const admin = await Employee.findById(req.user.id);
    if (!admin) return res.status(404).json({ msg: "User not found" });

    const exists = admin.pushSubscriptions?.some(sub => sub.endpoint === subscription.endpoint);
    
    if (!exists) {
      await Employee.findByIdAndUpdate(req.user.id, {
        $push: { pushSubscriptions: subscription }
      });
    }
    res.status(201).json({ msg: "Subscribed successfully" });
  } catch (err) { 
    res.status(500).json(err); 
  }
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
    const user = await Employee.findById(req.user.id);
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return res.status(400).json({ msg: "No push subscriptions found for your user." });
    }
    
    let sent = false;
    let lastError = null;
    for (const sub of user.pushSubscriptions) {
      try {
        await webpush.sendNotification(sub, JSON.stringify({
          title: "Test Notification 🚀",
          body: "Your push notifications are working perfectly!",
          icon: "/logo.png"
        }));
        sent = true;
      } catch (e) {
        lastError = e;
        console.error("Test Push error:", e);
      }
    }
    
    if (sent) {
      res.json({ msg: "Push sent!" });
    } else {
      let errMsg = "Unknown error";
      if (lastError) {
        errMsg = lastError.body || lastError.message || JSON.stringify(lastError);
      }
      res.status(500).json({ msg: "Push failed. Details: " + errMsg });
    }
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
