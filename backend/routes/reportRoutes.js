const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");

// All routes are protected
router.use(protect);

// Employee Ledger
router.get("/employee-ledger/:employeeId", reportController.getEmployeeLedger);

// Site Ledger
router.get("/site-ledger/:siteName", reportController.getSiteLedger);

// Project Ledger
router.get("/project-ledger/:projectId", reportController.getProjectLedger);

module.exports = router;
