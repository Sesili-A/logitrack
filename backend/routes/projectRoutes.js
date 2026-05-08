const router = require("express").Router();
const {
  getProjects, createProject, updateProject, deleteProject,
  getProjectDetail,
  getExpenses, addExpense, deleteExpense,
} = require("../controllers/projectController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get   ("/",                    protect, adminOnly, getProjects);
router.post  ("/",                    protect, adminOnly, createProject);
router.get   ("/:id",                 protect, adminOnly, getProjectDetail);
router.put   ("/:id",                 protect, adminOnly, updateProject);
router.delete("/:id",                 protect, adminOnly, deleteProject);

router.get   ("/:projectId/expenses", protect, adminOnly, getExpenses);
router.post  ("/:projectId/expenses", protect, adminOnly, addExpense);
router.delete("/:projectId/expenses/:expenseId", protect, adminOnly, deleteExpense);

module.exports = router;
