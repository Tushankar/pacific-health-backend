const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  toggle2FA,
  uploadProfilePicture,
} = require("../controllers/user.controller");
const { protect } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

// All routes are protected
router.use(protect);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.post("/profile-picture", upload.single("profilePicture"), uploadProfilePicture);
router.put("/change-password", changePassword);
router.put("/toggle-2fa", toggle2FA);

module.exports = router;
