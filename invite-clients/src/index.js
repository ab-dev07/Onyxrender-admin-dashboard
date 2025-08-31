require("dotenv").config();
const crypto = require("crypto");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const { User } = require("./models/users");
const { Invite, inviteSchemaValidate } = require("./models/invites");
const nodemailer = require("nodemailer");
const { isLoggedIn } = require("./middlewares/isLoggedIn");
const { isAdmin } = require("./middlewares/isAdmin");
const express = require("express");
const { connectDB } = require("./config/database");
const app = express();
const PORT = process.env.PORT || 8085;
const http = require('http');
const httpServer = http.createServer(app);
const { initSocket } = require("./config/socket")

initSocket(httpServer)

var cookieParser = require("cookie-parser");
const { authRouter } = require("./routes/auth.route");
const { admin } = require("./routes/adminOnly");
const { chatRouter } = require("./routes/chat");
const { clientRouter } = require("./routes/client");
const { stripe_webhook } = require("./controllers/client.controller");

const cors = require("cors");

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.post(
  "/client/webhook",
  express.raw({ type: "application/json" }),
  stripe_webhook
);
app.use(express.json());
app.use(cookieParser());
// Start server
connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
  });


app.use("/admin-only", admin);
app.use("/client", clientRouter);
app.use("/", authRouter);
app.use("/chat", chatRouter)
