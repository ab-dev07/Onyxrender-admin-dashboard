const express = require("express");
const { isLoggedIn } = require("../middlewares/isLoggedIn");
const { conversation, sendMessage, getMessages, getConversations, uploadFileMiddleware, markAsRead, getAllConversations, uploadFile, sendProjectMessage, sendInvoiceMessage } = require("../controllers/chat.controller");
const { isAdmin } = require("../middlewares/isAdmin");


const chatRouter = express.Router();

chatRouter.use(isLoggedIn);


chatRouter.post("/conversation/:clientId", conversation)
chatRouter.post("/send-project-message", sendProjectMessage)
chatRouter.post("/send-invoice-message", sendInvoiceMessage)
chatRouter.post("/upload-file", uploadFileMiddleware, uploadFile)
chatRouter.get("/messages/:conversationId", getMessages)
chatRouter.get("/conversations", getConversations)
chatRouter.post("/mark-as-read", markAsRead)
chatRouter.get("/all-conversations", isAdmin, getAllConversations);

module.exports = { chatRouter };