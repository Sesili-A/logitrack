const router = require("express").Router();
const { getNotifications, markAsRead, getVapidPublicKey, subscribeToPush } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.get("/",       protect, getNotifications);
router.put("/read",   protect, markAsRead);
router.get("/vapid-public-key", getVapidPublicKey);
router.post("/subscribe", protect, subscribeToPush);

module.exports = router;
