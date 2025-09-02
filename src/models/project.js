const mongoose = require("mongoose");
const Joi = require("joi");

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String, // String should be capitalized
      required: true,
      trim: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "ongoing", "completed"],
        message: `{VALUE} is not a valid status.`,
      },
      default: "pending",
    },
    budget: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true, // Store currency codes in uppercase like "USD", "PKR"
      minlength: 3,
      maxlength: 3,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: "No details given.",
    },
  },
  { timestamps: true }
);
const Project = mongoose.model("Project", projectSchema);
module.exports = Project;
