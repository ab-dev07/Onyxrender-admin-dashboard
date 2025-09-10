const express = require("express");
const { User } = require("../models/users");
const clientRouter = express.Router();
const { Invite } = require("../models/invites");
const { userSchemaValidate } = require("../validations/userSchemaValidate");
const { sendResponse } = require("../utils/standardResponse");
const { cloudinary } = require("../config/cloudinary");
const streamifier = require("streamifier");
const { makeHash } = require("../utils/makeHash");
const crypto = require("crypto");
const { sendResetEmail } = require("../utils/sendMail");
const { Token } = require("../models/token");
const bcrypt = require("bcrypt");

exports.registerClient = async (req, res) => {
  let { name, email, password, companyName, address, phoneNo, token, role } =
    req.body;
  // let profilePic = null;
  console.log(req.file);

  const alreadyUser = await User.findOne({ email });
  if (alreadyUser) {
    return sendResponse(res, 400, "User already exist.");
  }
  const invite = await Invite.findOne({ token });
  if (role == "client") {
    email = invite.email;
    if (!invite) {
      return sendResponse(res, 400, "Not invited (Asked Admin for invite)");
    }
    if (invite.token != token) {
      return sendResponse(res, 400, "Invalid token");
    }
    if (invite.expiredAt < Date.now()) {
      return sendResponse(res, 400, "Invitation Code Expired");
    }
  }

  // let profilePic = null;
  // if (req.file && req.file.buffer) {
  //   profilePic = await new Promise((resolve, reject) => {
  //     const stream = cloudinary.uploader.upload_stream(
  //       { folder: "images", resource_type: "auto" },
  //       (error, result) => {
  //         if (error) return reject(error);
  //         resolve(result.secure_url);
  //       }
  //     );
  //     streamifier.createReadStream(req.file.buffer).pipe(stream);
  //   });
  // }
  hashPassword = await makeHash(password);
  console.log("new password" + hashPassword);
  // console.log(invite);
  const user = await User.create({
    name,
    email,
    password: hashPassword,
    companyName,
    address,
    phoneNo,
    role: "client",
  });
  await user.save();
  await Invite.findOneAndUpdate(
    { email, token },
    {
      $set: {
        used: "used",
      },
    }
  );
  return sendResponse(res, 200, "Register successfully", user);
};

exports.login = async (req, res) => {
  const { email, password, role } = req.body;
  const { error } = userSchemaValidate.validate({ email, password, role });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  if (role == "admin") {
    if (email == "adminsuper@gmail.com" && password == "superadmin123") {
      const user = await User.findOne({ email });
      if (!user) {
        const user = await User.create({ email, password, role });
        await user.save();
        const token = await user.getJWT();
        res.cookie("token", token,  {
  httpOnly: true,
  secure: true,        // required for SameSite=None
  sameSite: "none",    // allow cross-site cookies
});
        return sendResponse(res, 200, "Admin Login Successfully", user);
      }
      const token = await user.getJWT();
      res.cookie("token", token , {
  httpOnly: true,
  secure: true,        // required for SameSite=None
  sameSite: "none",    // allow cross-site cookies
});
      return sendResponse(res, 200, "Admin Login Successfully", user);
    }

    return sendResponse(res, 400, "You are not admin");
  } else if (role == "client") {
    const user = await User.findOne({ email });

    if (!user) {
      return sendResponse(res, 400, "Client not found.", user);
    }
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return sendResponse(res, 400, "Email or Password is incorrect.");
    }
    const token = await user.getJWT();
    res.cookie("token", token, {
  httpOnly: true,
  secure: true,        // required for SameSite=None
  sameSite: "none",    // allow cross-site cookies
});
    return sendResponse(res, 200, "Client Login Successfully", user);
  }
};

exports.getUser = (req, res) => {
  const user = req.user;
  // Remove sensitive info like password
  if (user.password) user.password = undefined;
  sendResponse(res, 200, "User fetched successfully", user);
};

exports.forget_password = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return sendResponse(res, 404, "User not found.");
  }

  // Check if token already exists and is still valid
  const existingToken = await Token.findOne({
    userId: user._id,
    used: false,
    expiredAt: { $gt: Date.now() }, // still valid
  });

  if (existingToken) {
    const timeLeft = Math.ceil((existingToken.expiredAt - Date.now()) / 60000); // minutes
    return sendResponse(
      res,
      200,
      `A reset link was already sent. Please check your email. You can request again after ${timeLeft} minute(s).`
    );
  }

  // Create new token
  const token = crypto.randomBytes(20).toString("hex");
  await Token.create({
    userId: user._id,
    email: user.email,
    token,
    expiredAt: Date.now() + 15 * 60 * 1000, // 15 minutes
    used: false,
  });

  await sendResetEmail(user.email, token);
  return sendResponse(res, 200, "Reset link sent to your email.");
};

exports.reset_password = async (req, res) => {
  const { token, newPassword } = req.body;

  const tokenDoc = await Token.findOne({ token, used: false });
  if (!tokenDoc) return res.status(400).send("Invalid or expired token");
  if (tokenDoc.expiredAt < Date.now())
    return sendResponse(res, 400, "Token expired / reset Link.");

  const user = await User.findById(tokenDoc.userId);
  hashPassword = await makeHash(newPassword);
  user.password = hashPassword;
  await user.save();

  tokenDoc.used = true;
  await tokenDoc.save();
  return sendResponse(res, 200, "Password reset successful");
  // res.send("Password reset successful");
};

exports.change_password = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user._id; // Assuming auth middleware gives you req.user

  if (!currentPassword || !newPassword || !confirmPassword) {
    return sendResponse(res, 400, "All fields are required.");
  }

  if (newPassword !== confirmPassword) {
    return sendResponse(res, 400, "Passwords do not match.");
  }

  const user = await User.findById(userId);
  if (!user) {
    return sendResponse(res, 404, "User not found.");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return sendResponse(res, 400, "Current password is incorrect.");
  }

  if (await bcrypt.compare(newPassword, user.password)) {
    return sendResponse(
      res,
      400,
      "New password cannot be the same as old password."
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  sendResponse(res, 200, "Password changed successfully.");
};
