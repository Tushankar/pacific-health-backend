const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/user.model");
const Message = require("./models/chat.model");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:3000"],
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`👤 User connected: ${socket.user.fullName} (${socket.id})`);

    // Join a private room between two users
    socket.on("join_room", ({ otherUserId }) => {
      const room = [socket.user._id.toString(), otherUserId.toString()].sort().join("-");
      socket.join(room);
      console.log(`🏠 User ${socket.user.fullName} joined room: ${room}`);
    });

    // Send message
    socket.on("send_message", async ({ recipientId, message }) => {
      try {
        const room = [socket.user._id.toString(), recipientId.toString()].sort().join("-");

        // Save message to database
        const newMessage = await Message.create({
          sender: socket.user._id,
          recipient: recipientId,
          message,
          room,
        });

        // Emit message to the room
        io.to(room).emit("receive_message", {
          _id: newMessage._id,
          sender: {
            _id: socket.user._id,
            fullName: socket.user.fullName
          },
          recipient: recipientId,
          message: newMessage.message,
          room,
          createdAt: newMessage.createdAt
        });

      } catch (err) {
        console.error("Socket Send Message Error:", err);
      }
    });

    // Edit message
    socket.on("edit_message", async ({ messageId, newMessage }) => {
      try {
        const messageDoc = await Message.findOne({ _id: messageId, sender: socket.user._id });
        if (!messageDoc) return;

        messageDoc.message = newMessage;
        messageDoc.isEdited = true;
        await messageDoc.save();

        io.to(messageDoc.room).emit("message_edited", {
          _id: messageDoc._id,
          message: newMessage,
          isEdited: true
        });
      } catch (err) {
        console.error("Socket Edit Message Error:", err);
      }
    });

    // Delete message for me
    socket.on("delete_message_me", async ({ messageId }) => {
      try {
        const messageDoc = await Message.findById(messageId);
        if (!messageDoc) return;

        // Ensure user is part of the room
        if (messageDoc.sender.toString() !== socket.user._id.toString() &&
          messageDoc.recipient.toString() !== socket.user._id.toString()) {
          return;
        }

        if (!messageDoc.deletedForMe.includes(socket.user._id)) {
          messageDoc.deletedForMe.push(socket.user._id);
          await messageDoc.save();
        }

        // Emit back to the user who deleted it
        socket.emit("message_deleted_me", { messageId });
      } catch (err) {
        console.error("Socket Delete For Me Error:", err);
      }
    });

    // Delete message for everyone
    socket.on("delete_message_everyone", async ({ messageId }) => {
      try {
        const messageDoc = await Message.findOne({ _id: messageId, sender: socket.user._id });
        if (!messageDoc) return;

        messageDoc.deletedForEveryone = true;
        await messageDoc.save();

        io.to(messageDoc.room).emit("message_deleted_everyone", {
          _id: messageDoc._id
        });
      } catch (err) {
        console.error("Socket Delete For Everyone Error:", err);
      }
    });

    // Mark messages as read
    socket.on("mark_read", async ({ senderId }) => {
      try {
        const room = [socket.user._id.toString(), senderId.toString()].sort().join("-");

        io.to(room).emit("messages_read", {
          readerId: socket.user._id
        });
      } catch (err) {
        console.error("Socket Mark Read Error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 User disconnected: ${socket.user.fullName}`);
    });
  });

  return io;
};

module.exports = initSocket;
