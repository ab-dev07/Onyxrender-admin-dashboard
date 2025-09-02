const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'image', 'file', 'video', 'project', 'invoice'],
        required: true
    },
    content: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
    fileUrl: {
        type: String,
        default: null
    },
    metadata: {
        type: Object,   // optional (e.g., file size, projectId reference, etc.)
        default: {}
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent'
    }
}, { timestamps: true });

// Query optimization: fast lookup by conversation and chronological order
messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

module.exports = { Message };
