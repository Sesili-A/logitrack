const router = require("express").Router();
const {
  getCategories,
  createCategory,
  deleteCategory
} = require("../controllers/workerCategoryController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/",       protect, adminOnly, getCategories);
router.post("/",      protect, adminOnly, createCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

module.exports = router;
