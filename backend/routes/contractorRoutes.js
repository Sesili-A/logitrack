const router = require("express").Router();
const {
  getContractors,
  createContractor,
  updateContractor,
  deleteContractor
} = require("../controllers/contractorController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/",        protect, adminOnly, getContractors);
router.post("/",       protect, adminOnly, createContractor);
router.put("/:id",     protect, adminOnly, updateContractor);
router.delete("/:id",  protect, adminOnly, deleteContractor);

module.exports = router;
