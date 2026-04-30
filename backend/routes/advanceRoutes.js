const router = require("express").Router();
const {
  addAdvance,
  getAdvances,
  deleteAdvance,
} = require("../controllers/advanceController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/",        protect, adminOnly, getAdvances);
router.post("/",       protect, adminOnly, addAdvance);
router.delete("/:id",  protect, adminOnly, deleteAdvance);

module.exports = router;
