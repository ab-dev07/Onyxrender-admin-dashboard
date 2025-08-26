const express = require("express");
const { isLoggedIn } = require("../middlewares/isLoggedIn");
const { conversation, sendMessage, getMessages, getConversations, uploadFileMiddleware, markAsRead } = require("../controllers/chat.controller")


const chatRouter = express.Router();

chatRouter.use(isLoggedIn);


chatRouter.post("/conversation/:clientId", conversation)
chatRouter.post("/send-message", uploadFileMiddleware, sendMessage)
chatRouter.get("/messages/:conversationId", getMessages)
chatRouter.get("/conversations", getConversations)

module.exports = { chatRouter };