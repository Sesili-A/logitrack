require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const Employee = require("./models/Employee");
const Site = require("./models/Site");
const Attendance = require("./models/Attendance");
const Advance = require("./models/Advance");
const Notification = require("./models/Notification");

async function migrate() {
  await connectDB();
  
  // Find the primary admin (the first one created)
  const admin = await Employee.findOne({ role: "admin" });
  if (!admin) {
    console.log("No admin found in the database. Exiting.");
    process.exit(1);
  }
  
  const adminId = admin._id;
  console.log(`Migrating all orphaned data to Admin: ${admin.name} (${adminId})`);

  // Migrate Employees
  const empRes = await Employee.updateMany(
    { role: "employee", adminId: { $exists: false } },
    { $set: { adminId } }
  );
  console.log(`Migrated ${empRes.modifiedCount} workers.`);

  // Migrate Sites
  const siteRes = await Site.updateMany(
    { adminId: { $exists: false } },
    { $set: { adminId } }
  );
  console.log(`Migrated ${siteRes.modifiedCount} sites.`);

  // Migrate Attendance
  const attRes = await Attendance.updateMany(
    { adminId: { $exists: false } },
    { $set: { adminId } }
  );
  console.log(`Migrated ${attRes.modifiedCount} attendance records.`);

  // Migrate Advances
  const advRes = await Advance.updateMany(
    { adminId: { $exists: false } },
    { $set: { adminId } }
  );
  console.log(`Migrated ${advRes.modifiedCount} advances.`);

  // Migrate Notifications
  const notifRes = await Notification.updateMany(
    { adminId: { $exists: false } },
    { $set: { adminId } }
  );
  console.log(`Migrated ${notifRes.modifiedCount} notifications.`);

  console.log("\nMigration completed successfully! Your data is now fully Multi-Tenant.");
  process.exit(0);
}

migrate();
