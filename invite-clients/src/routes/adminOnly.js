const express = require("express");
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
const {
  all_invites,
  delete_invite,
  create_project,
  all_projects,
  delete_project,
  update_project,
  invite_client,
  delete_client,
  all_clients,
  create_invoice,
  all_invoices,
  delete_invoice,
  update_invoice,
  get_profile,
  update_profile,
  get_insights,
} = require("../controllers/adminOnly.controller");
const { registerClient } = require("../controllers/auth.controllers");

const admin = express.Router();

admin.use(isLoggedIn, isAdmin);

//admin profile
admin.get("/profile", get_profile);
admin.patch("/profile", update_profile);

//client section at admin side
admin.post("/create-client", registerClient);
admin.post("/invite-client", invite_client);
admin.get("/all-clients", all_clients);
admin.delete("/client/:id", delete_client);

//Projects Section At admin Side
admin.post("/create-project", create_project);
admin.get("/all-project", all_projects);
admin.delete("/project/:id", delete_project);
admin.put("/project/:id", update_project);

// invoice section at admin side
admin.post("/create-invoice", create_invoice);
admin.get("/all-invoices", all_invoices);
admin.delete("/invoice/:id", delete_invoice);
admin.put("/invoice/:id", update_invoice);

// invites at admin side
admin.get("/all-invites", all_invites);
admin.delete("/invite/:id", delete_invite);

//insights
admin.get("/insights", get_insights);

//

// admin.post("/auth/login-admin", registerClient);

module.exports = {
  admin,
};
