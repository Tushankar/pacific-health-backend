const express = require("express");
const router = express.Router();
const { getChatUsers, getMessages, markAsRead } = require("../controllers/chat.controller");
const { protect } = require("../middlewares/auth.middleware");

// All chat routes are protected
router.use(protect);

router.get("/users", getChatUsers);
router.get("/messages/:otherUserId", getMessages);
router.put("/mark-as-read/:senderId", markAsRead);

module.exports = router;
