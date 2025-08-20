const express = require("express");
const { User } = require("../models/users");
const clientRouter = express.Router();
const { Invite } = require("../models/invites");
const { isLoggedIn } = require("../middlewares/isLoggedIn");
const { isAdmin } = require("../middlewares/isAdmin");
const { object } = require("joi");
const Project = require("../models/project");
const { sendResponse } = require("../utils/standardResponse");

//client can get profile
clientRouter.get("/client/profile", isLoggedIn, async (req, res) => {
  try {
    const user = req.user;
    if (user) {
      return res.send(user);
    } else {
      throw new Error("User not found");
    }
  } catch (err) {
    res.send("err::" + err.message);
  }
});
//client can update profile
clientRouter.put("/client/profile", isLoggedIn, async (req, res) => {
  try {
    const user = req.user;
    const { name, profilePic } = req.body;
    if (name && profilePic) {
      return res.send("Dont send empty body");
    }
    if (user) {
      const updatedUser = await User.findOneAndUpdate(
        { email: user.email },
        {
          $set: {
            name,
            profilePic,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );
      return res.send(updatedUser);
    } else {
      throw new Error("User not found");
    }
  } catch (err) {
    res.send("err::" + err.message);
  }
});
clientRouter.get("/client/all-projects", isLoggedIn, async (req, res) => {
  try {
    const user = req.user;
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const totalitems = await Project.countDocuments({ clientId: user._id });
    const skip = (page - 1) * limit;
    const totalpage = Math.ceil(totalitems / limit);
    const meta = {
      totalitems,
      itemsperpage: limit,
      currentpage: page,
      totalpage,
    };
    const allProjects = await Project.find({ clientId: user._id })
      .populate("clientId", ["name", "email"])
      .skip(skip)
      .limit(limit);
    sendResponse(res, 200, "All Projects get successfully", allProjects, meta);
  } catch (err) {
    res.send("err::" + err.message);
  }
});
module.exports = {
  clientRouter,
};
