const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    program: {
      type: String,
      enum: ["NOW-COMP", "OTHER"],
      required: [true, "Program selection is required"],
    },
    status: {
      type: String,
      enum: ["pending", "submitted", "approved", "rejected"],
      default: "pending",
    },
    // Track individual form completion
    forms: [
      {
        formId: { type: Number, required: true },
        name: { type: String, required: true },
        chapter: { type: String, required: true },
        type: { type: String }, // Data Entry, Fillable, Signable, Upload
        status: {
          type: String,
          enum: ["not-started", "draft", "in-progress", "completed", "approved", "rejected"],
          default: "not-started",
        },
        adminNote: { type: String, default: "" },
        submittedAt: { type: Date, default: null },
        data: { type: mongoose.Schema.Types.Mixed, default: null },
        draftData: { type: mongoose.Schema.Types.Mixed, default: null },
        draftSavedAt: { type: Date, default: null },
      },
    ],
    adminNote: {
      type: String,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One pending enrollment per user at a time
enrollmentSchema.index({ user: 1, status: 1 });

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

module.exports = Enrollment;
