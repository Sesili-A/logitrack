const router = require("express").Router();
const {
  getSites, getAllSites, createSite, updateSite, deleteSite
} = require("../controllers/siteController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/",        protect, getSites);        // active sites (for dropdowns)
router.get("/all",     protect, adminOnly, getAllSites); // all sites (for settings)
router.post("/",       protect, adminOnly, createSite);
router.put("/:id",     protect, adminOnly, updateSite);
router.delete("/:id",  protect, adminOnly, deleteSite);

module.exports = router;
