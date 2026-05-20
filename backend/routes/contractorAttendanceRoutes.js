const router = require("express").Router();
const {
  getAttendance,
  saveAttendance,
  getPayroll
} = require("../controllers/contractorAttendanceController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/",        protect, adminOnly, getAttendance);
router.post("/",       protect, adminOnly, saveAttendance);
router.get("/payroll", protect, adminOnly, getPayroll);

module.exports = router;
