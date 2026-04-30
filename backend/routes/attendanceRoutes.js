const router = require("express").Router();
const {
  markAttendance,
  getTodayAttendance,
  getDashboardStats,
  getWeeklyPayroll,
  getAttendanceHistory,
} = require("../controllers/attendanceController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/mark",       protect, adminOnly, markAttendance);
router.get("/today",       protect, adminOnly, getTodayAttendance);
router.get("/stats",       protect, adminOnly, getDashboardStats);
router.get("/payroll",     protect, adminOnly, getWeeklyPayroll);
router.get("/history",     protect, adminOnly, getAttendanceHistory);

module.exports = router;