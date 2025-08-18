const mongoose = require("mongoose");
const Joi = require("joi");
const inviteSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    expiredAt: {
      type: Date,
      required: true,
    },
    used: {
      type: String,
      enums: ["not-used", "used"],
      default: "not-used",
    },
    
  },
  {
    timestamps: true,
  }
);
const inviteSchemaValidate = Joi.object({
  email: Joi.string().email().required(),
  token: Joi.string().required(),
  expiredAt: Joi.date().required(),
  used: Joi.string().valid("not-used", "used"),
  // status: Joi.string().enum(["active", "expired"]),
});
const Invite = mongoose.model("Invite", inviteSchema);
module.exports = { Invite, inviteSchemaValidate };
