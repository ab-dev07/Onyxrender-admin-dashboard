const express = require("express");
const { User } = require("../models/users");
const clientRouter = express.Router();
const { Invite } = require("../models/invites");
const { userSchemaValidate } = require("../validations/userSchemaValidate");
const { sendResponse } = require("../utils/standardResponse");
const { cloudinary } = require("../config/cloudinary");
const streamifier = require("streamifier");
const { makeHash } = require("../utils/makeHash");

const registerClient = async (req, res) => {
  const { fullname, password, token } = req.body;
  // let photoUrl = null;
  console.log(req.file);

  const alreadyUser = await User.findOne({ token });
  if (alreadyUser) {
    return sendResponse(res, 400, "User already exist.");
  }
  const invite = await Invite.findOne({ token });
  if (!invite) {
    return sendResponse(res, 400, "Not invited (Asked Admin for invite)");
  }
  if (invite.token != token) {
    return sendResponse(res, 400, "Invalid token");
  }
  if (invite.expiredAt < Date.now()) {
    return sendResponse(res, 400, "Invitation Code Expired");
  }
  let photoUrl = null;
  if (req.file && req.file.buffer) {
    photoUrl = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "images", resource_type: "auto" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });
  }
  hashPassword = await makeHash(password);
  console.log("new password" + hashPassword);
  console.log(invite);
  const user = await User.create({
    fullname,
    photoUrl,
    email: invite.email,
    password: hashPassword,
    role: "client",
  });
  await user.save();
  await Invite.findOneAndUpdate(
    { email: invite.email, token },
    {
      $set: {
        used: "used",
      },
    }
  );
  return sendResponse(res, 200, "Register successfully", user);
};

const login = async (req, res) => {
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
        res.cookie("token", token);
        return sendResponse(res, 200, "Admin Login Successfully", user);
      }
      const token = await user.getJWT();
      res.cookie("token", token);
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
      return sendResponse(res, 400, "Password is not validate.");
    }
    const token = await user.getJWT();
    res.cookie("token", token);
    return sendResponse(res, 200, "Client Login Successfully", user);
  }
};
module.exports = {
  registerClient,
  login,
};
