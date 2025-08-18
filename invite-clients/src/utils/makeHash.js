const bcrypt = require("bcrypt");
const saltRounds = 10;

const makeHash = async (password) => {
  const salt = await bcrypt.genSalt(saltRounds);
  const newPassword = await bcrypt.hash(password, salt);
  return newPassword;
};

module.exports = { makeHash };
