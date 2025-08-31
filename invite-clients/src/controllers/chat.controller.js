const { Conversation } = require("../models/conversation");
const { Message } = require("../models/message");
const { User } = require("../models/users");
const { sendResponse } = require("../utils/standardResponse");
const { mongoose } = require("mongoose");
const { uploadCloudinary } = require("../middlewares/uploadCloudinary")
const { chatUpload } = require("../utils/handleUpload")

exports.conversation = async (req, res) => {
    try {
        const clientId = req.params.clientId;

        const client = await User.findById(clientId);
        if (!client) return sendResponse(res, 404, null, "Client not found");

        if (client.role === "admin") {
            return sendResponse(res, 400, null, "Cannot create conversation with admin");
        }

        const existingConversation = await Conversation.findOne({ clientId });
        if (existingConversation) {
            const populatedConversation = await Conversation.findById(existingConversation._id).populate("clientId", "name profilePic _id").populate("lastMessage", "content id type status createdAt");

            return sendResponse(res, 200, "Conversation already exists", populatedConversation);
        }
        const newConversation = await Conversation.create({ clientId });
        // populate it with the client information and the last message
        const populatedConversation = await Conversation.findById(newConversation._id).populate("clientId", "name profilePic _id").populate("lastMessage", "content id type status createdAt");
        return sendResponse(res, 201, "New conversation created", populatedConversation);
    } catch (error) {
        res.send("Error::" + error.message);
    }
}

// Middleware for file upload (single file)
exports.uploadFileMiddleware = chatUpload(
    uploadCloudinary.single("file")
);

exports.uploadFile = async (req, res) => {
    try {
        console.log("File uploaded:", req.file);
        return sendResponse(res, 200, "File uploaded successfully", { fileUrl: req.fileUrl },);
    } catch (error) {
        res.send("Error::" + error.message);
    }
}

exports.sendMessage = async (req, res) => {
    try {
        const { conversationId, content } = req.body;
        const senderId = req.user._id;

        // Fetch conversation + sender in parallel
        const [conversation, sender] = await Promise.all([
            Conversation.findById(conversationId),
            User.findById(senderId),
        ]);

        if (!conversation) return sendResponse(res, 400, null, "Conversation not found");
        if (!sender) return sendResponse(res, 400, null, "User not found");

        const isClient = conversation.clientId.toString() === senderId.toString();
        const isAdmin = sender.role === "admin";

        if (!isClient && !isAdmin)
            return sendResponse(res, 403, null, "Not authorized");

        // Determine message type
        let messageType = "text";
        let messageContent = content && content.trim() ? content : "";

        if (req.fileUrl) {
            messageContent = req.fileUrl;
            const mime = req.fileMime;

            if (mime.startsWith("image/")) messageType = "image";
            else if (mime.startsWith("video/")) messageType = "video";
            else messageType = "file"; // docs, pdf, txt, etc.
        }

        if (!messageContent)
            return sendResponse(res, 400, null, "Message cannot be empty");

        // Create message
        const newMessage = await Message.create({
            conversationId,
            senderId,
            type: messageType,
            content: messageContent,
            metadata: { text: content || "" },
        });

        // Update conversation
        const now = new Date();
        let unreadUpdate = {};
        if (isClient) {
            if (!conversation.adminLastSeen || conversation.adminLastSeen < now)
                unreadUpdate = { $inc: { adminUnread: 1 } };
        } else if (isAdmin) {
            if (!conversation.clientLastSeen || conversation.clientLastSeen < now)
                unreadUpdate = { $inc: { clientUnread: 1 } };
        }

        await Conversation.findByIdAndUpdate(
            conversationId,
            { lastMessage: newMessage._id, ...unreadUpdate },
            { new: true }
        );

        const populatedMessage = await Message.findById(newMessage._id).populate(
            "senderId",
            "name profilePic _id"
        );

        return sendResponse(res, 200, populatedMessage, "Message sent successfully");
    } catch (error) {
        res.send("Error::" + error.message);
    }
};


exports.getMessages = async (req, res) => {
    console.log("API CALLED")
    try {
        const { conversationId } = req.params;
        const { before, limit = 10 } = req.query; // before = cursor (timestamp or messageId)

        console.log("BEFORE", before)
        console.log("LIMIT", limit)

        // 1. Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return sendResponse(res, 400, null, "Invalid conversation ID");
        }

        // 2. Parallel: find conversation + user
        const [conversation, receiver] = await Promise.all([
            Conversation.findById(conversationId),
            User.findById(req.user._id)
        ]);

        if (!conversation) return sendResponse(res, 404, null, "Conversation not found");
        if (!receiver) return sendResponse(res, 404, null, "User not found");

        // 3. Authorization check
        const isClient = conversation.clientId.toString() === receiver._id.toString();
        const isAdmin = receiver.role === "admin";

        if (!isClient && !isAdmin) {
            return sendResponse(res, 403, null, "You are not authorized to view this conversation");
        }

        // 4. Build query with cursor
        const query = { conversationId };

        if (before && before !== 'null') {
            // If before is a valid ObjectId → use it as cursor
            if (mongoose.Types.ObjectId.isValid(before)) {
                query._id = { $lt: before };
            } else {
                // Otherwise treat it as date
                query.createdAt = { $lt: new Date(before) };
            }
        }

        // 5. Fetch messages
        const messages = await Message.find(query)
            .populate("senderId", "name profilePic _id role")
            .sort({ createdAt: -1 }) // newest first
            .limit(parseInt(limit));

        // Reverse so frontend gets oldest → newest (chat bubble style)
        const orderedMessages = messages.reverse();


        // 6. Prepare meta for frontend (cursor-based)
        const meta = {
            hasMore: messages.length === parseInt(limit), // if we got full limit → likely more exist
            nextCursor: messages.length ? messages[0]._id : null // pass oldest messageId as next cursor
        };


        return sendResponse(res, 200, "Messages fetched successfully", orderedMessages, meta);
    } catch (error) {
        res.send("Error::" + error.message);
    }
};

exports.getConversations = async (req, res) => {
    try {
        const { before, limit = 10 } = req.query; // cursor = updatedAt
        const queryLimit = parseInt(limit);

        // 1. Build filter based on role
        let filter = {};
        if (req.user.role === "client") {
            filter.clientId = req.user._id;
        } // admins see all conversations

        // 2. Cursor condition (scroll-based)
        if (before) {
            filter.updatedAt = { $lt: new Date(before) };
        }

        // 3. Fetch conversations
        const conversations = await Conversation.find(filter)
            .populate("clientId", "name email profilePic")
            .populate({
                path: "lastMessage",
                populate: { path: "senderId", select: "name role" },
            })
            .sort({ updatedAt: -1 }) // newest first
            .limit(queryLimit);

        // 4. Prepare meta
        const meta = {
            hasMore: conversations.length === queryLimit,
            nextCursor: conversations.length
                ? conversations[conversations.length - 1].updatedAt
                : null,
        };

        return sendResponse(
            res,
            200,
            "Conversations fetched successfully",
            conversations,
            meta
        );
    } catch (error) {
        res.send("Error::" + error.message);
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return sendResponse(res, 400, null, "Invalid conversation ID");
        }

        const [conversation, user] = await Promise.all([
            Conversation.findById(conversationId),
            User.findById(req.user._id)
        ]);

        if (!conversation) return sendResponse(res, 400, null, "Conversation not found");
        if (!user) return sendResponse(res, 400, null, "User not found");

        const isClient = conversation.clientId.toString() === user._id.toString();
        const isAdmin = user.role === "admin";

        if (!isClient && !isAdmin) {
            return sendResponse(res, 400, null, "Not authorized");
        }

        const update =
            isClient ? { clientUnread: 0, clientLastSeen: new Date() }
                : { adminUnread: 0, adminLastSeen: new Date() };

        await Conversation.findByIdAndUpdate(conversationId, update);

        return sendResponse(res, 200, null, "Marked as read");
    } catch (err) {
        res.send("Error:: " + err.message);
    }
};

exports.getAllConversations = async (req, res) => {
    try {
        // return all the conversations
        const conversations = await Conversation.find()
            .populate("clientId", "name email profilePic")
            .populate({
                path: "lastMessage",
                populate: { path: "senderId", select: "_id name email profilePic role" },
            })
            .sort({ updatedAt: -1 });

        return sendResponse(res, 200, "All conversations fetched successfully", conversations);
    } catch (error) {
        res.send("Error::" + error.message);
    }
}