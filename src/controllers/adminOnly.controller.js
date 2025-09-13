const { Invite } = require("../models/invites");
const { Invoice, invoiceValidation } = require("../models/invoice");
const Project = require("../models/project");
const { User } = require("../models/users");
const { sendResponse } = require("../utils/standardResponse");
const { validateProject } = require("../validations/projectSchemaValidate");
const { sendInvitationEmail } = require("../utils/sendMail")
const crypto = require("crypto");
const { Conversation } = require("../models/conversation");
exports.all_invites = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const totalitems = await Invite.countDocuments();
    const skip = (page - 1) * limit;
    const totalpage = Math.ceil(totalitems / limit);
    const meta = {
      totalitems,
      itemsperpage: limit,
      currentpage: page,
      totalpage,
    };
    const allProjects = await Invite.find()
      .select("-token")
      .skip(skip)
      .limit(limit)
      .lean();
    const transformed = allProjects.map((project) => {
      const isUsed = project.used === "used";

      return {
        ...project,
        sendDate: isUsed ? project.createdAt : project.updatedAt,
        isRegister: isUsed ? "yes" : "no",
        status: new Date(project.expiredAt) < Date.now() ? "expire" : "active",
      };
    });
    sendResponse(res, 200, "All Invites get successfully", transformed, meta);
  } catch (err) {
    res.send("err::" + err.message);
  }
};
exports.delete_invite = async (req, res) => {
  try {
    const id = req.params.id;

    const deletedInvite = await Invite.findByIdAndDelete(id);
    if (!deletedInvite) {
      return sendResponse(res, 400, "Project dont existed");
    }
    sendResponse(res, 200, "Projects deleted successfully");
  } catch (err) {
    res.send("err::" + err.message);
  }
};

exports.create_project = async (req, res) => {
  const body = req.body;
  console.log(body);
  const { error } = validateProject(body);
  console.log(error);
  if (error) {
    return sendResponse(
      res,
      400,
      error.details[0].message || "Unwanted payloads"
    );
  }
  console.log(body);
  const client = await User.findById({
    _id: body.clientId,
    role: { $ne: "admin" },
  });
  if (!client) {
    return sendResponse(res, 400, "Client not found");
  }
  const project = await Project.create(body);
  await project.save();
  return sendResponse(res, 200, "Project created successfully", project);
};
exports.all_projects = async (req, res) => {
  const user = req.user;
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  limit = limit > 50 ? 50 : limit;
  const skip = (page - 1) * limit;

  let filter = {};
  let projection = {};
  let populate = null;

  if (user.role === "client") {
    filter = { clientId: user._id }; // ✅ only that client's projects
    projection = "-clientId"; // hide clientId
  } else if (user.role === "admin") {
    filter = {}; // ✅ all projects
    populate = { path: "clientId", select: "name email profilePic" };
  }

  const totalitems = await Project.countDocuments(filter);
  const totalpage = Math.ceil(totalitems / limit);

  const allProjectsQuery = Project.find({ ...filter, isDeleted: false })
    .select(projection)
    .sort({ createdAt: -1 }) // latest first
    .skip(skip)
    .limit(limit);


  if (populate) {
    allProjectsQuery.populate(populate);
  }

  const allProjects = await allProjectsQuery;

  const meta = {
    totalitems,
    itemsperpage: limit,
    currentpage: page,
    totalpage,
  };

  sendResponse(
    res,
    200,
    "All Projects fetched successfully",
    allProjects,
    meta
  );
};



exports.delete_project = async (req, res) => {
  try {
    const id = req.params.id;

    const deletedProject = await Project.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true } // return the updated doc
    );
    if (!deletedProject) {
      return sendResponse(res, 400, "Project don't existed");
    }
    sendResponse(res, 200, "Projects deleted successfully", deletedProject);
  } catch (err) {
    res.send("err::" + err.message);
  }
};
exports.update_project = async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body;
    const { error } = validateProject(body);
    console.log(error);
    if (error) {
      return sendResponse(res, 400, error.details[0].message);
    }
    const updatedProject = await Project.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!updatedProject) {
      return sendResponse(res, 400, "Project dont existed");
    }
    sendResponse(res, 200, "Projects updated successfully");
  } catch (err) {
    res.send("err::" + err.message);
  }
};

exports.invite_client = async (req, res) => {
  let { email, days = 1 } = req.body;
  const expiredAt = Date.now() + days * 24 * 60 * 60 * 1000;
  let invite = await Invite.findOne({ email });
  const token = crypto.randomBytes(20).toString("hex");
  console.log(token);
  if (!invite) {
    invite = await Invite.create({ email, expiredAt, token });
    await sendInvitationEmail(email, token);
    return sendResponse(res, 200, "Invitation Send", invite);
  }
  if (invite.used == "used") {
    return sendResponse(res, 400, "This user is already register.");
  }
  if (invite.used === "not-used" && invite.expiredAt > Date.now()) {
    return sendResponse(res, 400, "Already sent invite to mail.");
  }
  if (invite.used === "not-used" && invite.expiredAt < Date.now()) {
    await sendInvitationEmail(email, token);
    const invite = await Invite.findOneAndUpdate(
      { email },
      { $set: { expiredAt, token } },
      { new: true }
    );
    return sendResponse(res, 200, "Invitation Send", invite);
  }
  return sendResponse(res, 200, "No action performed", invite);
};
exports.all_clients = async (req, res) => {
  let { page = 1, limit = 10 } = req.query;
  limit = limit > 50 ? 50 : parseInt(limit);
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const totalitems = await User.countDocuments({ role: { $ne: "admin" } });
  const totalpages = Math.ceil(totalitems / limit);

  const meta = {
    totalitems,
    itemsperpage: limit,
    currentpage: parseInt(page),
    totalpages,
  };

  const all_client = await User.find({ role: { $ne: "admin" } })
    .select("-password")
    .sort({ createdAt: -1 }) // Sort by createdAt in descending order (newest first)
    .skip(skip)
    .limit(limit);

  sendResponse(res, 200, "All clients get successfully", all_client, meta);
};

exports.all_clients_projects = async (req, res) => {
  try {
    const all_clients = await User.find({ role: { $ne: "admin" } }).select("-password")
    sendResponse(res, 200, "All clients get successfully", all_clients);
  } catch (error) {
    res.send("err::" + error.message)
  }
}


exports.delete_client = async (req, res) => {
  try {
    const id = req.params.id;
    const userProjects = await Project.countDocuments({ clientId: id });
    if (userProjects) {
      console.log("Projects", userProjects)
      return sendResponse(
        res,
        400,
        `No you cant del because user have ${userProjects} no of porjects`
      );
    }
    const deletedInvite = await User.findByIdAndDelete(id);
    if (!deletedInvite) {
      return sendResponse(res, 400, "Client dont existed");
    }
    sendResponse(res, 200, "Client deleted successfully", userProjects);
  } catch (err) {
    res.send("err::" + err.message);
  }
};

//invoices at admin side
exports.create_invoice = async (req, res) => {
  // Validate request body
  const { error, value } = invoiceValidation.validate(req.body, {
    abortEarly: false, // show all errors, not just first
  });

  if (error) {
    return sendResponse(
      res,
      400,
      "Validation Error",
      error.details.map((err) => err.message)
    );
  }
  const project = await Project.findById(req.body.projectId);
  if (!project) return sendResponse(res, 404, "No Project Found.");
  const invoice = await Invoice.create(value);
  sendResponse(res, 201, "Invoice created successfully", invoice);
};
exports.all_invoices = async (req, res) => {
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;

  // max limit protection
  limit = limit > 50 ? 50 : limit;

  const totalitems = await Invoice.countDocuments();
  const skip = (page - 1) * limit;
  const totalpage = Math.ceil(totalitems / limit);

  const meta = {
    totalitems,
    itemsperpage: limit,
    currentpage: page,
    totalpage,
  };

  const invoices = await Invoice.find({ isDeleted: false })
    .populate({
      path: "projectId",
      select: "title clientId",
      populate: {
        path: "clientId",
        select: "name profilePic email",
      },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  sendResponse(res, 200, "Invoices fetched successfully", invoices, meta);
};
exports.update_invoice = async (req, res) => {
  const allowedFields = [
    "amount",
    "status",
    "issueDate",
    "dueDate",
    "description",
    "currency",
  ];
  const updates = {};

  // pick only allowed fields from req.body
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (Object.keys(updates).length === 0) {
    return sendResponse(res, 400, "No valid fields provided to update");
  }
  const updatedInvoice = await Invoice.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!updatedInvoice) {
    return sendResponse(res, 404, "Invoice not found");
  }

  sendResponse(res, 200, "Invoice updated successfully", updatedInvoice);
};
exports.delete_invoice = async (req, res) => {
  const deletedInvoice = await Invoice.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true },
    { new: true } // return the updated doc
  );

  if (!deletedInvoice) {
    return sendResponse(res, 404, "Invoice not found");
  }

  sendResponse(res, 200, "Invoice deleted successfully", deletedInvoice);
};

exports.get_profile = async (req, res) => {
  const user = req.user;
  // Remove sensitive info like password
  if (user.password) user.password = undefined;
  sendResponse(res, 200, "User fetched successfully", user);
};


exports.update_profile = async (req, res) => {
  const userId = req.user._id;
  const { companyName, address, phoneNo, name } = req.body;

  const updates = {};
  if (companyName !== undefined) updates.companyName = companyName;
  if (address !== undefined) updates.address = address;
  if (phoneNo !== undefined) updates.phoneNo = phoneNo;
  if (name !== undefined) updates.name = name;

  if (Object.keys(updates).length === 0) {
    return sendResponse(res, 400, "No valid fields provided to update");
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");
    if (!updatedUser) {
      return sendResponse(res, 404, "User not found");
    }
    sendResponse(res, 200, "Profile updated successfully", updatedUser);
  } catch (err) {
    sendResponse(res, 500, "Error updating profile", err.message);
  }
};
// exports.get_invoice_by_id = async (req, res) => {
//   try {
//     const invoice = await Invoice.findById(req.params.id).populate({
//       path: "projectId",
//       select: "name clientId",
//       populate: {
//         path: "clientId",
//         select: "name profilePic email",
//       },
//     });

//     if (!invoice) {
//       return sendResponse(res, 404, "Invoice not found");
//     }

//     sendResponse(res, 200, "Invoice fetched successfully", invoice);
//   } catch (error) {
//     console.error("Get Invoice Error:", error);
//     sendResponse(res, 500, "Something went wrong", error.message);
//   }
// };

//insighs

exports.get_insights = async (req, res) => {
  // Clients (excluding admins)
  const totalClients = await User.countDocuments({ role: { $ne: "admin" } });

  // Projects
  const totalProjects = await Project.countDocuments();
  const completedProjects = await Project.countDocuments({
    status: "completed",
  });
  const ongoingProjects = await Project.countDocuments({ status: "ongoing" });

  // Invoices
  const totalInvoices = await Invoice.countDocuments();
  const completedInvoices = await Invoice.countDocuments({
    status: "completed",
  });
  const pendingInvoices = await Invoice.countDocuments({ status: "pending" });

  const totalPayment = await Invoice.aggregate([
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const completedPayment = await Invoice.aggregate([
    { $match: { status: "completed" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const pendingPayment = await Invoice.aggregate([
    { $match: { status: "pending" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  // Invites
  const totalInvites = await Invite.countDocuments();
  const acceptedInvites = await Invite.countDocuments({ used: "used" });
  const pendingInvites = await Invite.countDocuments({
    used: "not-used",
    expiredAt: { $gt: Date.now() },
  });
  const expiredInvites = await Invite.countDocuments({
    used: "not-used",
    expiredAt: { $lt: Date.now() },
  });

  const insights = {
    clients: totalClients,
    projects: {
      total: totalProjects,
      completed: completedProjects,
      ongoing: ongoingProjects,
    },
    invoices: {
      total: totalInvoices,
      completed: completedInvoices,
      pending: pendingInvoices,
    },
    payments: {
      total: totalPayment[0]?.total || 0,
      completed: completedPayment[0]?.total || 0,
      pending: pendingPayment[0]?.total || 0,
    },
    invites: {
      total: totalInvites,
      accepted: acceptedInvites,
      pending: pendingInvites,
      expired: expiredInvites,
    },
  };

  sendResponse(res, 200, "Insights fetched successfully", insights);
};

exports.createClientConversation = async (req, res) => {
  try {
    const { clientId } = req.body;

    if (!clientId) {
      sendResponse(res, 400, "Client ID is required");
      return;
    }

    const findClient = await User.findById(clientId);
    if (!findClient) {
      sendResponse(res, 404, "Client not found");
      return;
    }

    const existingConversation = await Conversation.findOne({ clientId: clientId });

    if (existingConversation) {
      sendResponse(res, 400, "Conversation already exists", existingConversation);
      return;
    }

    // Create a new conversation
    const newConversation = await Conversation.create({
      clientId: findClient._id,
    });

    sendResponse(res, 201, "Conversation created successfully", newConversation);
  } catch (err) {
    res.send("err::" + err.message);
  }
}
