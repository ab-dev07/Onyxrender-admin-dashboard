const express = require("express");
const { registerClient, login, getUser } = require("../controllers/auth.controllers");
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

//used by client to register with the code send by client on email
authRouter.post(
  "/auth/register-client",
  memoryUpload.single("photoUrl"),

  registerClient
);

//used by client and admin to login
authRouter.post("/auth/login", login);


//used to get the details of the logged in user
authRouter.get("/auth/user", isLoggedIn, getUser);



module.exports = {
  authRouter,
};
