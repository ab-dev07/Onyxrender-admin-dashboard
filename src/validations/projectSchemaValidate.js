const Joi = require("joi");

const validateProject = (data) => {
  const schema = Joi.object({
    title: Joi.string().trim().required().messages({
      "string.empty": "Title is required.",
    }),
    clientId: Joi.string().hex().length(24).required().messages({
      "string.hex": "Client ID must be a valid ObjectId.",
    }),
    description: Joi.string()
      .trim()
      .empty("") // treat "" as undefined
      .default("No details given."),
    status: Joi.string().valid("pending", "completed", "ongoing").default("pending"),
    isDeleted: Joi.boolean(),
    budget: Joi.number().min(0).required().messages({
      "number.base": "Budget must be a number.",
      "any.required": "Budget is required.",
    }),
    currency: Joi.string().uppercase().length(3).required().messages({
      "string.length":
        "Currency must be a valid 3-letter code (e.g., USD, PKR).",
    }),
    startDate: Joi.date().required().messages({
      "date.base": "Start date must be a valid date.",
    }),
    endDate: Joi.date()
      .greater(Joi.ref("startDate"))
      .allow(null) // ✅ allow null values
      .optional()
      .messages({
        "date.base": "End date must be a valid date.",
        "date.greater": "End date must be after start date.",
      }),
  });

  return schema.validate(data, { abortEarly: false });
};

module.exports = { validateProject };
