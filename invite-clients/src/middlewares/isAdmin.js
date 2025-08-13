const { sendResponse } = require("../utils/standardResponse");

const isAdmin = async (req, res, next) => {
  const user = req.user;
  if (user.role != "admin") {
    return sendResponse(res, 400, "You are not admin");
  }
  next();
};
module.exports = {
  isAdmin,
};
