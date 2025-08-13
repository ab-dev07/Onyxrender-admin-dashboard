const jwt = require("jsonwebtoken");
const { User } = require("../models/users");
const { sendResponse } = require("../utils/standardResponse");

const isLoggedIn = async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return sendResponse(res, 400, "First login then access this");
  }
  const decoded = jwt.verify(token, "secretKey");
  if (!decoded) {
    return sendResponse(res, 400, "Invalid token");
  }
  const { _id } = decoded;

  const user = await User.findById({ _id });
  if (!user) {
    return sendResponse(res, 400, "User not found");
  }
  req.user = user;
  next();
};

module.exports = {
  isLoggedIn,
};
