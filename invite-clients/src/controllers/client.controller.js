const { sendResponse } = require("../utils/standardResponse");
const Project = require("../models/project");
const { Invoice } = require("../models/invoice");

exports.user_insights = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "client") {
      return sendResponse(
        res,
        403,
        "Access denied. Only clients can view their insights."
      );
    }
    const projects = await Project.find({ clientId: user._id });

    const totalProjects = projects.length;
    const completedProjects = projects.filter(
      (p) => p.status === "completed"
    ).length;
    const ongoingProjects = projects.filter(
      (p) => p.status === "ongoing"
    ).length;
    const pendingProjects = projects.filter(
      (p) => p.status === "pending"
    ).length;

    const insights = {
      totalProjects,
      completedProjects,
      ongoingProjects,
      pendingProjects,
    };

    sendResponse(res, 200, "Client insights fetched successfully", insights);
  } catch (error) {
    console.error("Error fetching user insights:", error);
    sendResponse(res, 500, "Something went wrong while fetching insights");
  }
};

exports.user_invoices = async (req, res) => {
  const userId = req.user._id;

  // Get project IDs owned by user
  const projectIds = await Project.find({ clientId: userId }).distinct("_id");

  const invoices = await Invoice.find({ projectId: { $in: projectIds } })
    .populate({
      path: "projectId",
      select: "title",
    })
    .sort({ createdAt: -1 });

  sendResponse(res, 200, "User invoices fetched successfully", invoices);
};
