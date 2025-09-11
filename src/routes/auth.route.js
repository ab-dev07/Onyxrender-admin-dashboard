const express = require("express");
const {
  registerClient,
  login,
  getUser,
  forget_password,
  reset_password,
  change_password,
  get_profile,
  logout,
} = require("../controllers/auth.controllers");
const { User } = require("../models/users");
const { userSchemaValidate } = require("../validations/userSchemaValidate");
const { isLoggedIn } = require("../middlewares/isLoggedIn");
const {
  uploadPhotos,
  memoryUpload,
} = require("../middlewares/uploadCloudinary");
const { hanldeUpload } = require("../utils/handleUpload");

const authRouter = express.Router();
//used by client to register with the code send by client on email
authRouter.post("/auth/register-client", registerClient);
authRouter.post("/auth/login", login);
authRouter.post("/auth/forget-password", forget_password);
authRouter.post("/auth/reset-password", reset_password);
authRouter.post("/auth/change-password", isLoggedIn, change_password);
authRouter.post("/auth/logout", isLoggedIn, logout);

//used to get the details of the logged in user
authRouter.get("/auth/user", isLoggedIn, getUser);

module.exports = {
  authRouter,
};
