const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Can be null for system notifications
    },
    type: {
      type: String,
      enum: [
        "enrollment_submitted",
        "enrollment_approved",
        "enrollment_rejected",
        "form_completed",
        "form_submitted_again",
        "form_approved",
        "form_rejected",
        "admin_note",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" },
      formId: { type: Number },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
