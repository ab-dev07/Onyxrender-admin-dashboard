const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,   // store last message ID for fast chat list
        ref: "Message",
        default: null
    },
    adminUnread: {   // messages the admin has not read yet
        type: Number,
        default: 0
    },
    clientUnread: {  // messages the client has not read yet
        type: Number,
        default: 0
    },
    clientLastSeen: {
        type: Date,
        default: null
    },
    adminLastSeen: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Ensure one unique conversation per client
conversationSchema.index({ clientId: 1 }, { unique: true });

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = { Conversation };
