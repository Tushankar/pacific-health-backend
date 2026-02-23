const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    deletedForMe: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
    room: {
      type: String,
      required: true, // Typically `${userId1}-${userId2}` (sorted alphabetically)
    },
  },
  { timestamps: true }
);

// Index for faster searching of messages in a room
messageSchema.index({ room: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
