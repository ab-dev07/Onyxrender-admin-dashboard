//this is used for forget password token

const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },

  email: { type: String, required: true },
  token: { type: String, required: true },
  expiredAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
});
const Token = mongoose.model("Token", tokenSchema);
module.exports = {
  Token,
};
