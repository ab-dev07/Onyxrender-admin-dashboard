const express = require("express");
const { User } = require("../models/users");
const clientRouter = express.Router();
const { Invite } = require("../models/invites");
const { isLoggedIn } = require("../middlewares/isLoggedIn");
const { isAdmin } = require("../middlewares/isAdmin");
const { object } = require("joi");
const Project = require("../models/project");
const { sendResponse } = require("../utils/standardResponse");
const {
  get_profile,
  update_profile,
  all_projects,
} = require("../controllers/adminOnly.controller");
const {
  user_insights,
  user_invoices,
} = require("../controllers/client.controller");

//client can get profile
clientRouter.use(isLoggedIn);
clientRouter.get("/profile", get_profile);
clientRouter.put("/profile", update_profile);

clientRouter.get("/all-projects", all_projects);

clientRouter.get("/insights", user_insights);
clientRouter.get("/all-invoices", user_invoices);
module.exports = {
  clientRouter,
};
