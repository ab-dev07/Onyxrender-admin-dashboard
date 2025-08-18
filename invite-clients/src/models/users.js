const mongoose = require("mongoose");
const Joi = require("joi"); // Add this at the top
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Client",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: {
        values: ["admin", "client"],
        message: "{VALUE} is not a valid status",
      },
    },
    photoUrl: {
      type: String,
      default: "example.com",
    },
  },
  {
    timestamps: true,
  }
);
userSchema.methods.getJWT = async function () {
  const user = this;
  const token = await jwt.sign({ _id: user._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "7d",
  });
  return token;
};
userSchema.methods.validatePassword = async function (passwordEnterFromUser) {
  const user = this;
  const hashPassword = user.password;
  const isPasswordValid = await bcrypt.compare(
    passwordEnterFromUser,
    hashPassword
  );
  return isPasswordValid;
};
const User = mongoose.model("User", userSchema);

module.exports = { User };
