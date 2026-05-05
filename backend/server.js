const express = require("express");
const cors    = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

// Models needed for scheduled task
const Attendance = require("./models/Attendance");
const Notification = require("./models/Notification");
const Employee = require("./models/Employee");
const { sendPushToAdmin } = require("./controllers/notificationController");

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth",       require("./routes/authRoutes"));
app.use("/api/employees",  require("./routes/employeeRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/advances",   require("./routes/advanceRoutes"));
app.use("/api/sites",      require("./routes/siteRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

connectDB().then(async () => {
  try {
    await Employee.collection.dropIndexes();
    await Employee.syncIndexes();
    console.log("Indexes synchronized successfully.");
  } catch (err) {
    console.log("Index sync error:", err.message);
  }
});

app.get("/", (req, res) => res.send("logiTrack API Running..."));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // ── SCHEDULED TASK: 6 PM Attendance Reminder ──
  // Check every minute. If it's 18:00 (6 PM) and attendance isn't marked, send alert.
  setInterval(async () => {
    const now = new Date();
    // Only run exactly at 18:00
    if (now.getHours() === 18 && now.getMinutes() === 0) {
      try {
        const dayStart = new Date(); dayStart.setHours(0,0,0,0);
        const dayEnd   = new Date(); dayEnd.setHours(23,59,59,999);
        
        // Check for EACH admin separately
        const admins = await Employee.find({ role: "admin" });
        for (const admin of admins) {
          const count = await Attendance.countDocuments({ 
            date: { $gte: dayStart, $lte: dayEnd },
            adminId: admin._id
          });
          
          if (count === 0) {
            console.log(`\n[ALERT] 6:00 PM - Daily attendance NOT marked for admin: ${admin.name}`);
            
            await Notification.create({
              title: "Action Required: Attendance Pending",
              message: "It is past 6 PM and today's attendance has not been updated.",
              adminId: admin._id
            });

            await sendPushToAdmin(admin._id, {
              title: "Action Required: Attendance Pending",
              body: "It is past 6 PM and today's attendance has not been updated.",
              icon: "/logo.png"
            });
            
            console.log(`[SMS SIMULATION] Sending SMS to ${admin.phone || "Admin"}: "Reminder: Please mark today's attendance."\n`);
          }
        }
      } catch (err) {
        console.error("Scheduled task error:", err);
      }
    }
  }, 60000); // run every 60 seconds
});
