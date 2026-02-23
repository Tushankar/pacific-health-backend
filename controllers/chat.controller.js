const Message = require("../models/chat.model");
const User = require("../models/user.model");
// We need to inject the io instance here, or simpler, we can emit from socket.io when mark as read happens
// The easiest way without circular dependencies is to handle isRead locally in the frontend when sending markAsRead, but since we are refetching, 
// let's just make the frontend optimistic or add a socket emit in the frontend markAsRead.

/**
 * @desc    Get all users for chat (admin sees everyone, user sees admins)
 * @route   GET /api/chat/users
 * @access  Private
 */
/**
 * @desc    Get all users for chat (admin sees everyone, user sees admins)
 * @route   GET /api/chat/users
 * @access  Private
 */
const getChatUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    let users;

    if (req.user.role === "admin") {
      users = await User.find({ _id: { $ne: userId } }).select("fullName email role profileImage");
    } else {
      users = await User.find({ role: "admin" }).select("fullName email role profileImage");
    }

    // Enhance users with unread count and last message
    const enhancedUsers = await Promise.all(
      users.map(async (user) => {
        const room = [userId.toString(), user._id.toString()].sort().join("-");

        // Count unread messages for this recipient from this sender
        const unreadCount = await Message.countDocuments({
          room,
          recipient: userId,
          isRead: false,
          deletedForMe: { $ne: userId }
        });

        // Get the very last message in this room
        const lastMessage = await Message.findOne({ room })
          .sort({ createdAt: -1 })
          .select("message createdAt sender deletedForEveryone isEdited deletedForMe");

        const isLastMsgDeletedForMe = lastMessage ? lastMessage.deletedForMe.some(id => id.toString() === userId.toString()) : false;

        return {
          ...user.toObject(),
          unreadCount,
          lastMessage: lastMessage ? {
            content: (lastMessage.deletedForEveryone || isLastMsgDeletedForMe) ? "This message was deleted" : lastMessage.message,
            createdAt: lastMessage.createdAt,
            sender: lastMessage.sender,
            isEdited: lastMessage.isEdited,
            deletedForEveryone: lastMessage.deletedForEveryone,
            isDeletedForMe: isLastMsgDeletedForMe
          } : null
        };
      })
    );

    res.status(200).json({
      success: true,
      users: enhancedUsers,
    });
  } catch (error) {
    console.error("Get Chat Users Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc    Mark all messages from a user as read
 * @route   PUT /api/chat/mark-as-read/:senderId
 * @access  Private
 */
const markAsRead = async (req, res) => {
  try {
    const { senderId } = req.params;
    const userId = req.user._id;
    const room = [userId.toString(), senderId.toString()].sort().join("-");

    await Message.updateMany(
      { room, recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: "Messages marked as read"
    });
  } catch (error) {
    console.error("Mark As Read Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc    Get message history between two users
 * @route   GET /api/chat/messages/:otherUserId
 * @access  Private
 */
const getMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user._id;

    // Create room ID (sorted IDs to ensure consistency)
    const room = [userId.toString(), otherUserId.toString()].sort().join("-");

    const messages = await Message.find({ room })
      .sort({ createdAt: 1 })
      .populate("sender", "fullName")
      .populate("recipient", "fullName");

    // Also mark as read when fetching history
    await Message.updateMany(
      { room, recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get Messages Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  getChatUsers,
  getMessages,
  markAsRead,
};
