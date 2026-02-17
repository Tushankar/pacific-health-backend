const Enrollment = require("../models/enrollment.model");
const Notification = require("../models/notification.model");
const User = require("../models/user.model");

// ── Form definitions (mirrors frontend) ──
const NOW_COMP_FORMS = [
  { chapter: "Chapter I- Admission Packet-Nursing", forms: [
    { formId: 1, name: "Client Information Form", type: "Data Entry" },
    { formId: 2, name: "Service Agreement Form", type: "Fillable" },
    { formId: 3, name: "Service Agreement Addendum", type: "Fillable" },
    { formId: 4, name: "Service Care Plan", type: "Fillable" },
    { formId: 5, name: "Initial Comprehensive Assessment", type: "Fillable" },
    { formId: 6, name: "Risk Mitigation Plan", type: "Fillable" },
    { formId: 7, name: "Self-Preservation", type: "Fillable" },
    { formId: 8, name: "Medication List", type: "Fillable" },
    { formId: 9, name: "Doctor's Orders", type: "Upload" },
    { formId: 10, name: "Abnormal Involuntary Movement Scale (AIMS)", type: "Fillable" },
  ]},
  { chapter: "Chapter II- Admission Packet-Others", forms: [
    { formId: 11, name: "Client Rights and Responsibilities", type: "Signable" },
    { formId: 12, name: "CODE OF ETHICS POLICY", type: "Signable" },
    { formId: 13, name: "AUTHORIZATION FOR RELEASE OF INFORMATION – STANDARD REQUEST", type: "Fillable" },
    { formId: 14, name: "Vehicle/ Funds Policy", type: "Signable" },
    { formId: 15, name: "My Human Rights", type: "Fillable" },
    { formId: 16, name: "Freedom of Choice", type: "Upload" },
    { formId: 17, name: "Advance Directives", type: "Upload" },
    { formId: 18, name: "HIPAA/ Confidentiality", type: "Signable" },
    { formId: 19, name: "Grievance and Complaints for Individuals", type: "Fillable" },
    { formId: 20, name: "Abuse & Neglect", type: "Fillable" },
  ]},
  { chapter: "Chapter III- Tracking", forms: [
    { formId: 21, name: "ISP/ Training Sign-off", type: "Fillable" },
    { formId: 22, name: "HRST/ Training Sign-off", type: "Fillable" },
    { formId: 23, name: "Behavior Support Plan (BSP)-(Optional)", type: "Upload" },
    { formId: 24, name: "BSP Tracking/Progress Notes (Optional)", type: "Fillable" },
    { formId: 25, name: "Health Care Plan/ Protocols/ Training Sign-Off", type: "Fillable" },
    { formId: 26, name: "Medication Admin. Record (MAR) Training Sign-Off (Optional)", type: "Fillable" },
  ]},
  { chapter: "Chapter IV- Documentation & Medical Treatment", forms: [
    { formId: 27, name: "Visitor Log", type: "Fillable" },
    { formId: 28, name: "Rights Training/ Monthly Review", type: "Fillable" },
    { formId: 29, name: "Doctor's Appointment Log", type: "Fillable" },
    { formId: 30, name: "Supervisory Visit Documentation", type: "Fillable" },
    { formId: 31, name: "Annuals (Physical, TB, Dental, Vision)", type: "Upload" },
  ]},
];

const OTHER_FORMS = [
  { chapter: "Chapter I- Admission Packet", forms: [
    { formId: 1, name: "Client Information Form", type: "Data Entry" },
    { formId: 2, name: "Service Agreement Form", type: "Fillable" },
    { formId: 3, name: "Service Agreement Addendum", type: "Fillable" },
    { formId: 4, name: "Service Care Plan", type: "Fillable" },
    { formId: 5, name: "Medication List", type: "Fillable" },
    { formId: 6, name: "Comprehensive Initial Nursing Assessment", type: "Fillable" },
    { formId: 7, name: "Client Rights and Responsibilities", type: "Signable" },
    { formId: 8, name: "CODE OF ETHICS POLICY", type: "Signable" },
  ]},
  { chapter: "Chapter II- Service Documentation", forms: [
    { formId: 9, name: "Home Supervisory Visit", type: "Fillable" },
    { formId: 10, name: "INCIDENT REPORTING FORM", type: "Fillable" },
    { formId: 11, name: "Client Complaint Form", type: "Fillable" },
  ]},
];

function getFormsForProgram(program) {
  const chapters = program === "NOW-COMP" ? NOW_COMP_FORMS : OTHER_FORMS;
  const flat = [];
  for (const ch of chapters) {
    for (const f of ch.forms) {
      flat.push({ formId: f.formId, name: f.name, chapter: ch.chapter, type: f.type, status: "not-started" });
    }
  }
  return flat;
}

/**
 * @desc    Create a new enrollment (select program)
 * @route   POST /api/enrollment
 * @access  Private
 */
const createEnrollment = async (req, res) => {
  try {
    const { program } = req.body;

    if (!program || !["NOW-COMP", "OTHER"].includes(program)) {
      return res.status(400).json({ success: false, message: "Invalid program. Choose NOW-COMP or OTHER." });
    }

    // Check if user already has a pending enrollment
    const existing = await Enrollment.findOne({ user: req.user._id, status: "pending" });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending enrollment. Wait for admin review before starting a new one.",
        enrollment: existing,
      });
    }

    const enrollment = await Enrollment.create({
      user: req.user._id,
      program,
      forms: getFormsForProgram(program),
    });

    res.status(201).json({
      success: true,
      message: `Enrollment created for ${program} program.`,
      enrollment,
    });
  } catch (error) {
    console.error("Create Enrollment Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc    Get current user's active enrollment
 * @route   GET /api/enrollment/my
 * @access  Private
 */
const getMyEnrollment = async (req, res) => {
  try {
    // Get pending or submitted first (active workflows)
    const enrollment = await Enrollment.findOne({ 
      user: req.user._id, 
      status: { $in: ["pending", "submitted"] } 
    }).sort({ createdAt: -1 });

    if (!enrollment) {
      return res.status(200).json({ success: true, enrollment: null });
    }

    res.status(200).json({ success: true, enrollment });
  } catch (error) {
    console.error("Get My Enrollment Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc    Get specific enrollment by ID (user)
 * @route   GET /api/enrollment/my/:id
 * @access  Private
 */
const getEnrollmentById = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found." });
    }

    res.status(200).json({ success: true, enrollment });
  } catch (error) {
    console.error("Get Enrollment By ID Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc    Get all enrollments for the current user (history)
 * @route   GET /api/enrollment/my/all
 * @access  Private
 */
const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, enrollments });
  } catch (error) {
    console.error("Get My Enrollments Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc    Update a form's status within the enrollment
 * @route   PUT /api/enrollment/:id/form/:formId
 * @access  Private
 */
const updateFormStatus = async (req, res) => {
  try {
    const { id, formId } = req.params;
    const { status, formData } = req.body;

    if (!["not-started", "in-progress", "completed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid form status." });
    }

    const enrollment = await Enrollment.findOne({ _id: id, user: req.user._id });
    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found." });
    }

    if (enrollment.status !== "pending" && enrollment.status !== "approved" && enrollment.status !== "rejected" && enrollment.status !== "submitted") {
      return res.status(400).json({ success: false, message: "This enrollment is finalized and cannot be edited." });
    }

    const form = enrollment.forms.find((f) => f.formId === parseInt(formId));
    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found in enrollment." });
    }

    // If enrollment is submitted, only allow editing if the form was rejected
    if (enrollment.status === "submitted" && form.status !== "rejected") {
      return res.status(400).json({ success: false, message: "This form is currently under review and cannot be edited." });
    }

    const oldFormStatus = form.status;
    form.status = status;
    if (status === "completed") {
      form.submittedAt = new Date();
      form.draftData = null;
      form.draftSavedAt = null;

      // Notify admins if form was previously rejected (re-submission)
      if (oldFormStatus === "rejected") {
        const admins = await User.find({ role: "admin" });
        for (const admin of admins) {
          await Notification.create({
            recipient: admin._id,
            sender: req.user._id,
            type: "form_submitted_again",
            title: "Form Resubmitted",
            message: `${req.user.fullName} has resubmitted the form: ${form.name}`,
            metadata: { enrollmentId: id, formId: parseInt(formId) },
          });
        }
      }
    }
    if (formData) form.data = formData;

    // Calculate Phase 1 progress
    const program = enrollment.program;
    let phase1FormIds;
    if (program === "NOW-COMP") {
      // Chapter I (1-10) + Chapter II (11-20) = Phase 1
      phase1FormIds = Array.from({ length: 20 }, (_, i) => i + 1);
    } else {
      // Chapter I (1-8) = Phase 1
      phase1FormIds = Array.from({ length: 8 }, (_, i) => i + 1);
    }

    const phase1Forms = enrollment.forms.filter(f => phase1FormIds.includes(f.formId));
    const completedPhase1 = phase1Forms.filter(f => f.status === "completed").length;
    const totalPhase1 = phase1Forms.length;

    await enrollment.save();

    res.status(200).json({
      success: true,
      message: "Form status updated.",
      enrollment,
      progress: {
        completed: completedPhase1,
        total: totalPhase1,
        percent: totalPhase1 > 0 ? Math.round((completedPhase1 / totalPhase1) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("Update Form Status Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc    Submit enrollment for admin review
 * @route   PUT /api/enrollment/:id/submit
 * @access  Private
 */
const submitEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({ _id: req.params.id, user: req.user._id });
    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found." });
    }

    if (enrollment.status !== "pending") {
      return res.status(400).json({ success: false, message: "Enrollment already submitted." });
    }

    enrollment.status = "submitted";
    enrollment.submittedAt = new Date();
    await enrollment.save();

    // Notify Admins
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        sender: req.user._id,
        type: "enrollment_submitted",
        title: "New Application Submitted",
        message: `${req.user.fullName} has submitted their application for the ${enrollment.program} program.`,
        metadata: { enrollmentId: req.params.id },
      });
    }

    res.status(200).json({ success: true, message: "Enrollment submitted for admin review!", enrollment });
  } catch (error) {
    console.error("Submit Enrollment Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc    Save draft data for a form (auto-save on navigation)
 * @route   PUT /api/enrollment/:id/form/:formId/draft
 * @access  Private
 */
const saveDraft = async (req, res) => {
  try {
    const { id, formId } = req.params;
    const { draftData } = req.body;

    if (!draftData) {
      return res.status(400).json({ success: false, message: "No draft data provided." });
    }

    const enrollment = await Enrollment.findOne({ _id: id, user: req.user._id });
    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found." });
    }

    if (enrollment.status !== "pending" && enrollment.status !== "approved" && enrollment.status !== "rejected" && enrollment.status !== "submitted") {
      return res.status(400).json({ success: false, message: "This enrollment is finalized and cannot be edited." });
    }

    const form = enrollment.forms.find((f) => f.formId === parseInt(formId));
    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found in enrollment." });
    }

    // If enrollment is submitted, only allow editing if the form was rejected
    if (enrollment.status === "submitted" && form.status !== "rejected") {
      return res.status(400).json({ success: false, message: "This form is currently under review and cannot be edited." });
    }

    // Only save draft if form is not already completed
    if (form.status === "completed") {
      return res.status(200).json({ success: true, message: "Form already completed. Draft not saved.", skipped: true });
    }

    form.draftData = draftData;
    form.draftSavedAt = new Date();
    if (form.status === "not-started") {
      form.status = "draft";
    }

    await enrollment.save();

    res.status(200).json({
      success: true,
      message: "Draft saved successfully.",
      formId: parseInt(formId),
      draftSavedAt: form.draftSavedAt,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc    Upload document for a form
 * @route   POST /api/enrollment/:id/form/:formId/upload
 * @access  Private
 */
const uploadDocument = async (req, res) => {
  try {
    const { id, formId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    const enrollment = await Enrollment.findOne({ _id: id, user: req.user._id });
    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found." });
    }

    const form = enrollment.forms.find((f) => f.formId === parseInt(formId));
    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found in enrollment." });
    }

    // Store file info
    const fileData = {
      path: `uploads/${id}/${req.file.filename}`,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date()
    };

    // Update form status and data
    form.data = fileData;
    form.status = "completed";
    form.submittedAt = new Date();
    form.draftData = null; // Clear draft on upload success

    await enrollment.save();

    res.status(200).json({
      success: true,
      message: "File uploaded successfully.",
      formId: parseInt(formId),
      data: fileData
    });
  } catch (error) {
    console.error("Upload Document Error:", error);
    res.status(500).json({ success: false, message: "Server error during upload." });
  }
};

// ═══ ADMIN ENDPOINTS ═══

/**
 * @desc    Get all enrollments (admin)
 * @route   GET /api/enrollment/admin/all
 * @access  Private (admin)
 */
const getAllEnrollments = async (req, res) => {
  try {
    const { status, program } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (program) filter.program = program;

    const enrollments = await Enrollment.find(filter)
      .populate("user", "fullName email phoneNumber")
      .populate("reviewedBy", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: enrollments.length, enrollments });
  } catch (error) {
    console.error("Get All Enrollments Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc    Get a single enrollment detail (admin)
 * @route   GET /api/enrollment/admin/:id
 * @access  Private (admin)
 */
const getEnrollmentDetail = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate("user", "fullName email phoneNumber")
      .populate("reviewedBy", "fullName email");

    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found." });
    }

    res.status(200).json({ success: true, enrollment });
  } catch (error) {
    console.error("Get Enrollment Detail Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc    Approve or reject enrollment (admin)
 * @route   PUT /api/enrollment/admin/:id/review
 * @access  Private (admin)
 */
const reviewEnrollment = async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'approved' or 'rejected'." });
    }

    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found." });
    }

    enrollment.status = status;
    enrollment.adminNote = adminNote || "";
    enrollment.reviewedAt = new Date();
    enrollment.reviewedBy = req.user._id;
    await enrollment.save();

    // Notify User
    await Notification.create({
      recipient: enrollment.user,
      sender: req.user._id,
      type: status === "approved" ? "enrollment_approved" : "enrollment_rejected",
      title: status === "approved" ? "Application Approved" : "Application Rejected",
      message: status === "approved" 
        ? "Congratulations! Your application has been approved." 
        : `Your application was rejected. Reason: ${adminNote || "No specific reason provided."}`,
      metadata: { enrollmentId: req.params.id },
    });

    res.status(200).json({
      success: true,
      message: `Enrollment ${status} successfully.`,
      enrollment,
    });
  } catch (error) {
    console.error("Review Enrollment Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const reviewForm = async (req, res) => {
  try {
    const { id, formId } = req.params;
    const { status, adminNote } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'approved' or 'rejected'." });
    }

    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found." });
    }

    const form = enrollment.forms.find((f) => f.formId === parseInt(formId));
    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found." });
    }

    form.status = status;
    form.adminNote = adminNote || "";
    
    await enrollment.save();

    // Notify User
    await Notification.create({
      recipient: enrollment.user,
      sender: req.user._id,
      type: status === "approved" ? "form_approved" : "form_rejected",
      title: status === "approved" ? "Form Approved" : "Form Rejected",
      message: status === "approved" 
        ? `Your form '${form.name}' has been approved.` 
        : `Your form '${form.name}' was rejected. Reason: ${adminNote || "No specific reason provided."}`,
      metadata: { enrollmentId: id, formId: parseInt(formId) },
    });

    res.status(200).json({
      success: true,
      message: `Form ${status} successfully.`,
      form,
    });
  } catch (error) {
    console.error("Review Form Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
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
  reviewForm,
  uploadDocument,
};
