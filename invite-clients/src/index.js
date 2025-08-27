require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { connectDB } = require("./config/database");
const { User } = require("./models/users");
const { Invite, inviteSchemaValidate } = require("./models/invites");
const nodemailer = require("nodemailer");
const app = express();
const PORT = process.env.PORT || 8085;

var cookieParser = require("cookie-parser");
const { authRouter } = require("./routes/auth.route");
const { admin } = require("./routes/adminOnly");
const { isLoggedIn } = require("./middlewares/isLoggedIn");
const { isAdmin } = require("./middlewares/isAdmin");
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
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
  });


app.use("/admin-only", admin);
app.use("/client", clientRouter);
app.use("/", authRouter);
