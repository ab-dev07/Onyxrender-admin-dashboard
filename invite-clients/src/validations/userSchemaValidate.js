const Joi = require("joi");
const userSchemaValidate = Joi.object({
  name: Joi.string(),
  email: Joi.string().email().required().messages({
    "string.email": "Invalid email.",
    "any.required": "Email is required.",
  }),
  password: Joi.string()
    .required()
    .messages({ "any.required": "Password is required." }),
  profilePic: Joi.string()
    .uri()
    .allow("")
    .messages({ "string.uri": "Profile picture must be a valid URL." }),
  companyName: Joi.string().allow(""),
  companyLogo: Joi.string()
    .uri()
    .allow("")
    .messages({ "string.uri": "Company logo must be a valid URL." }),
  address: Joi.string().allow(""),
  phoneNo: Joi.string().allow(""),
  role: Joi.string().valid("admin", "client").required().messages({
    "any.only": "Role must be admin or client.",
    "any.required": "Role is required.",
  }),
});
module.exports = {
  userSchemaValidate,
};
