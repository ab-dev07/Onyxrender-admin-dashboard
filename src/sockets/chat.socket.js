// sockets/chat.socket.js
const { Conversation } = require("../models/conversation");
const { Message } = require("../models/message");
const { User } = require("../models/users");

exports.chatSocket = (io, socket) => {
    const user = socket.user;

    // --- Track admin's current private room ---
    socket.currentConversationRoom = null;

    // --- Join global room for admins ---
    if (user.role === "admin") {
        socket.join("admin:all");
        console.log("✅ Admin joined global room:", socket.id);
    }

    // --- Handle joining private conversation ---
    socket.on("join_conversation", async ({ conversationId }) => {
        const newRoom = `conversation:${conversationId}`;

        if (user.role === "admin") {
            // Leave previous private room if any
            if (socket.currentConversationRoom && socket.currentConversationRoom !== newRoom) {
                socket.leave(socket.currentConversationRoom);
                console.log(`${user.email} left room ${socket.currentConversationRoom}`);
            }

            // Join the new private conversation
            socket.join(newRoom);
            socket.currentConversationRoom = newRoom;
            console.log(`${user.email} joined room ${newRoom}`);

            // Reset admin unread count
            try {
                const updatedConversation = await Conversation.findByIdAndUpdate(
                    conversationId,
                    {
                        adminLastSeen: new Date(),
                        adminUnread: 0
                    },
                    { new: true }
                );

                if (updatedConversation) {
                    io.to("admin:all").emit("unread_reset", {
                        conversationId,
                        adminUnread: 0
                    });
                }
                console.log(`✅ Admin unread reset for conversation ${conversationId}`);
            } catch (err) {
                console.error("❌ Error updating admin read status:", err);
            }
        } else {
            // --- Client joins (no restriction, can be in multiple rooms) ---
            socket.join(newRoom);
            console.log(`${user.email} joined room ${newRoom}`);

            try {
                await Conversation.findByIdAndUpdate(
                    conversationId,
                    {
                        clientLastSeen: new Date(),
                        clientUnread: 0
                    }
                );
            } catch (err) {
                console.error("❌ Error updating client read status:", err);
            }
        }
    });

    // --- Handle sending a message ---
    socket.on("send_message", async (msg) => {
        try {
            const { conversationId, senderId, type: messageType, content: messageContent, fileUrl } = msg;

            console.log("📨 Sending message:", msg);

            // Validate input
            if (!conversationId || !senderId || !messageContent?.trim()) {
                socket.emit("error_message", "Invalid message data");
                return;
            }

            // Fetch conversation + sender
            const [conversation, sender] = await Promise.all([
                Conversation.findById(conversationId).populate('clientId', 'name email profilePic companyLogo'),
                User.findById(senderId).select('name email profilePic role'),
            ]);

            if (!conversation) {
                socket.emit("error_message", "Conversation not found");
                return;
            }
            if (!sender) {
                socket.emit("error_message", "User not found");
                return;
            }

            const isClient = conversation.clientId._id.toString() === senderId.toString();
            const isAdmin = sender.role === "admin";

            if (!isClient && !isAdmin) {
                socket.emit("error_message", "Not authorized");
                return;
            }

            // Save new message
            const newMessage = await Message.create({
                conversationId,
                senderId,
                type: messageType,
                fileUrl: fileUrl,
                content: messageContent,
                metadata: { text: messageContent || "" },
            });

            await newMessage.populate('senderId', 'name email profilePic role');

            if (!newMessage) throw new Error("Message not saved");

            // --- Handle unread counts ---
            const conversationSockets = await io.in(`conversation:${conversationId}`).fetchSockets();

            let shouldIncrementAdminUnread = false;
            let shouldIncrementClientUnread = false;

            if (isClient) {
                const adminInConversation = conversationSockets.some(s => s.user && s.user.role === "admin");
                shouldIncrementAdminUnread = !adminInConversation;
            } else if (isAdmin) {
                const clientInConversation = conversationSockets.some(s =>
                    s.user && s.user._id.toString() === conversation.clientId._id.toString()
                );
                shouldIncrementClientUnread = !clientInConversation;
            }

            // Update conversation lastMessage
            await Conversation.findByIdAndUpdate(conversationId, { lastMessage: newMessage._id });

            // Update unread counts
            let updatedConversation;
            if (shouldIncrementAdminUnread) {
                updatedConversation = await Conversation.findByIdAndUpdate(
                    conversationId,
                    { $inc: { adminUnread: 1 } },
                    { new: true }
                );
            } else if (shouldIncrementClientUnread) {
                updatedConversation = await Conversation.findByIdAndUpdate(
                    conversationId,
                    { $inc: { clientUnread: 1 } },
                    { new: true }
                );
            } else {
                updatedConversation = await Conversation.findById(conversationId);
            }

            // Format outgoing message
            const messageToEmit = {
                _id: newMessage._id,
                conversationId: newMessage.conversationId,
                senderId: newMessage.senderId._id,
                senderInfo: {
                    name: newMessage.senderId.name,
                    email: newMessage.senderId.email,
                    profilePic: newMessage.senderId.profilePic,
                    role: newMessage.senderId.role
                },
                type: newMessage.type,
                content: newMessage.content,
                fileUrl: newMessage.fileUrl,
                metadata: newMessage.metadata,
                createdAt: newMessage.createdAt,
                tempId: msg.tempId,
                adminUnread: updatedConversation.adminUnread || 0,
                clientUnread: updatedConversation.clientUnread || 0
            };

            console.log("Message to emit", messageToEmit);
            // Emit message to participants
            io.to(`conversation:${conversationId}`).emit("receive_message", messageToEmit);

            // Also send to admin global room (for sidebar updates)
            io.to("admin:all").emit("receive_message", messageToEmit);

            console.log(`✅ Message sent in conversation ${conversationId} by ${sender.email}`);
        } catch (err) {
            console.error("❌ Error sending message:", err);
            socket.emit("error_message", "Failed to send message");
        }
    });

    socket.on("typing_start", async ({ conversationId }) => {
        socket.to(`conversation:${conversationId}`).emit("user_typing", {
            userId: user._id, userName: user.name,
            isTyping: true
        });
    });

    socket.on("typing_stop", ({ conversationId }) => {
        socket.to(`conversation:${conversationId}`).emit("user_typing", {
            userId: user._id,
            userName: user.name,
            isTyping: false
        });
    });

    // --- Disconnect handler ---
    socket.on("disconnect", () => {
        console.log(`🔌 User ${user.email} disconnected from chat`);
    });
};
