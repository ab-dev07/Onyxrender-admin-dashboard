const mongoose = require("mongoose");
const Joi = require("joi");
const invoiceSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project", // Reference to Project model
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["paid", "unpaid"],
      default: "unpaid",
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true, // e.g. USD, EUR, PKR
    },
  },
  { timestamps: true }
);

const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

const invoiceValidation = Joi.object({
  projectId: Joi.string().custom(objectIdValidator).required(),
  amount: Joi.number().positive().required(),
  status: Joi.string().valid("paid", "unpaid").default("unpaid"),
  issueDate: Joi.date().default(Date.now),
  dueDate: Joi.date().greater(Joi.ref("issueDate")).required(),
  description: Joi.string().allow(""),
  currency: Joi.string().uppercase().length(3).default("USD"),
});

const Invoice = mongoose.model("Invoice", invoiceSchema);
module.exports = {
  Invoice,
  invoiceValidation,
};
