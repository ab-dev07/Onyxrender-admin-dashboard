const jwt = require("jsonwebtoken");
const { User } = require("../models/users");
const { sendResponse } = require("../utils/standardResponse");

const isLoggedIn = async (req, res, next) => {
  const { token } = req.cookies;
  const headerToken = req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (headerToken) {
    req.token = headerToken;
  }
  if (!token && !headerToken) {
    return sendResponse(res, 400, "First login then access this");
  }
  const decoded = jwt.verify(token || headerToken, process.env.JWT_SECRET_KEY);
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
