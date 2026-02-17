const express = require("express");
const router = express.Router();
const {
  createEnrollment,
  getMyEnrollment,
  getEnrollmentById,
  getMyEnrollments,
  updateFormStatus,
  saveDraft,
  submitEnrollment,
  getAllEnrollments,
  getEnrollmentDetail,
  reviewEnrollment,
  uploadDocument,
  reviewForm,
} = require("../controllers/enrollment.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");
const upload = require("../config/multer.config");

// All routes require authentication
router.use(protect);

// Standard Enrollment Routes
router.post("/", createEnrollment);
router.get("/my", getMyEnrollment);
router.get("/my/all", getMyEnrollments);
router.get("/my/:id", getEnrollmentById);
router.put("/:id/form/:formId", updateFormStatus);
router.put("/:id/form/:formId/draft", saveDraft);
router.post("/:id/form/:formId/upload", upload.single("file"), uploadDocument);
router.put("/:id/submit", submitEnrollment);

// ── Admin routes ──
router.get("/admin/all", authorize("admin"), getAllEnrollments);
router.get("/admin/:id", authorize("admin"), getEnrollmentDetail);
router.put("/admin/:id/review", authorize("admin"), reviewEnrollment);
router.put("/admin/:id/form/:formId/review", authorize("admin"), reviewForm);

module.exports = router;
