const express = require("express");
const { registerClient } = require("../controllers/auth.controllers");
const { User } = require("../models/users");
const { userSchemaValidate } = require("../validations/userSchemaValidate");
const { isLoggedIn } = require("../middlewares/isLoggedIn");
const { isAdmin } = require("../middlewares/isAdmin");
const { sendResponse } = require("../utils/standardResponse");
const { validateProject } = require("../validations/projectSchemaValidate");
const project = require("../models/project");
const Project = require("../models/project");
const { Invite } = require("../models/invites");
const { sendInvitationEmail } = require("../utils/sendMail");
const crypto = require("crypto"); // Make sure this is at the top of your file

const admin = express.Router();
admin.post(
  "/admin-only/invite-client",
  isLoggedIn,
  isAdmin,
  async (req, res) => {
    let { email, days = 1 } = req.body;
    const expiredAt = Date.now() + days * 24 * 60 * 60 * 1000;
    let invite = await Invite.findOne({ email });
    const token = crypto.randomBytes(20).toString("hex");
    console.log(token);
    if (!invite) {
      invite = await Invite.create({ email, expiredAt, token });
      await sendInvitationEmail(email, token);
      return sendResponse(res, 200, "Invitation Send", invite);
    }
    if (invite.used == "used") {
      return sendResponse(res, 400, "This user is already register.");
    }
    if (invite.used === "not-used" && invite.expiredAt > Date.now()) {
      return sendResponse(res, 400, "Already sent invite to mail.");
    }
    if (invite.used === "not-used" && invite.expiredAt < Date.now()) {
      await sendInvitationEmail(email, token);
      const invite = await Invite.findOneAndUpdate(
        { email },
        { $set: { expiredAt, token } },
        { new: true }
      );
      return sendResponse(res, 200, "Invitation Send", invite);
    }
    return sendResponse(res, 200, "No action performed", invite);
  }
);
admin.get("/admin-only/all-clients", isLoggedIn, isAdmin, async (req, res) => {
  let { page = 1, limit = 10 } = req.query;
  limit = limit > 50 ? 50 : parseInt(limit);
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const totalitems = await User.countDocuments({ role: { $ne: "admin" } });
  const totalpages = Math.ceil(totalitems / limit);
  const meta = {
    totalitems,
    itemsperpage: limit,
    currentpage: page,
    totalpages,
  };
  const all_client = await User.find({ role: { $ne: "admin" } })
    .select("-password ")
    .skip(skip)
    .limit(limit);
  sendResponse(res, 200, "All clients get successfully", all_client, meta);
});

admin.post(
  "/admin-only/create-project",
  isLoggedIn,
  isAdmin,
  async (req, res) => {
    const body = req.body;
    const { error } = validateProject(body);
    if (error) {
      return sendResponse(res, 400, "Unwanted payloads");
    }
    console.log(body);
    const client = await User.findById({
      _id: body.clientId,
      role: { $ne: "admin" },
    });
    console.log(client);
    if (!client) {
      return sendResponse(res, 400, "Client not found");
    }
    const project = await Project.create(body);
    await project.save();
    return sendResponse(res, 200, "Project created successfully", project);
  }
);
admin.get("/admin-only/all-project", isLoggedIn, isAdmin, async (req, res) => {
  try {
    const user = req.user;
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const totalitems = await Project.countDocuments();
    const skip = (page - 1) * limit;
    const totalpage = Math.ceil(totalitems / limit);
    const meta = {
      totalitems,
      itemsperpage: limit,
      currentpage: page,
      totalpage,
    };
    const allProjects = await Project.find()
      .populate("clientId", ["name", "email"])
      .skip(skip)
      .limit(limit);
    sendResponse(res, 200, "All Projects get successfully", allProjects, meta);
  } catch (err) {
    res.send("err::" + err.message);
  }
});
admin.delete(
  "/admin-only/project/:id",
  isLoggedIn,
  isAdmin,
  async (req, res) => {
    try {
      const id = req.params.id;

      const deletedProject = await Project.findByIdAndDelete(id);
      if (!deletedProject) {
        return sendResponse(res, 400, "Project dont existed");
      }
      sendResponse(res, 200, "Projects deleted successfully", deletedProject);
    } catch (err) {
      res.send("err::" + err.message);
    }
  }
);
admin.put("/admin-only/project/:id", isLoggedIn, isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body;
    const { error } = validateProject(body);
    console.log(error);
    if (error) {
      return sendResponse(res, 400, error.details[0].message);
    }
    const updatedProject = await Project.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!updatedProject) {
      return sendResponse(res, 400, "Project dont existed");
    }
    sendResponse(res, 200, "Projects updated successfully");
  } catch (err) {
    res.send("err::" + err.message);
  }
});

admin.post("/auth/login-admin", registerClient);

module.exports = {
  admin,
};
