const express = require("express");
const { User } = require("../models/users");
const clientRouter = express.Router();
const { Invite } = require("../models/invites");
const { userSchemaValidate } = require("../validations/userSchemaValidate");
const { sendResponse } = require("../utils/standardResponse");

const registerClient = async (req, res) => {
  const { fullname, email, password, token } = req.body;
  const alreadyUser = await User.findOne({ email });
  if (alreadyUser) {
    return sendResponse(res, 400, "User already exist.");
  }
  const invite = await Invite.findOne({ email });
  if (!invite) {
    return sendResponse(res, 400, "Not invited (Asked Admin for invite)");
  }
  if (invite.token != token) {
    return sendResponse(res, 400, "Invalid token");
  }
  if (invite.expiredAt < Date.now()) {
    return sendResponse(res, 400, "Invitation Code Expired");
  }
  const user = await User.create({
    fullname,
    email,
    password,
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
    const user = await User.findOne({ email, password });
    if (!user) {
      return sendResponse(res, 400, "Client not found.", user);
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
