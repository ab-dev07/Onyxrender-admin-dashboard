const Joi = require("joi");
const userSchemaValidate = Joi.object({
  name: Joi.string().default("Client").messages({
    "string.base": "Name must be a string.",
  }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Please provide a valid email address.",
      "any.required": "Email is required.",
    }),
  password: Joi.string().required().messages({
    "any.required": "Password is required.",
  }),
  role: Joi.string().valid("admin", "client").required().messages({
    "any.only": "Role must be either 'admin' or 'client'.",
    "any.required": "Role is required.",
  }),
  photoUrl: Joi.string().uri().default("example.com").messages({
    "string.uri": "Photo URL must be a valid URI.",
  }),
});
module.exports = {
  userSchemaValidate,
};
