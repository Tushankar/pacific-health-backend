const express = require("express");
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notification.controller");
const { protect } = require("../middlewares/auth.middleware");

// All routes are protected
router.use(protect);

router.get("/", getMyNotifications);
router.put("/read-all", markAllAsRead);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
