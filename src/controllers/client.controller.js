const { sendResponse } = require("../utils/standardResponse");
const Project = require("../models/project");
const { Invoice } = require("../models/invoice");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { sendPaymentReceiptEmail } = require("../utils/sendMail");

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
exports.payment = async (req, res) => {
  try {
    const { projectName, amount, id } = req.body;

    if (!projectName || !amount) {
      return sendResponse(res, 400, "Project name and amount are required");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: projectName, // must not be empty
            },
            unit_amount: Math.round(Number(amount) * 100), // ensure number
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "http://localhost:3000/dashboard/client/invoices",
      cancel_url: "http://localhost:3000/dashboard/client/invoices",
      metadata: {
        invoiceId: id || "N/A", // optional, link to your invoice
      },
    });

    // ✅ send back the session details (usually the URL)
    return sendResponse(res, 200, "Payment session created", {
      id: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return sendResponse(res, 500, "Something went wrong while processing payment");
  }
};
exports.stripe_webhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle event types
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("✅ Checkout session completed:", session.id);

    const invoiceId = session.metadata?.invoiceId;
    if (invoiceId && invoiceId !== "N/A") {
      try {
        await Invoice.findByIdAndUpdate(invoiceId, { status: "paid" });

        // Fetch invoice with project and client to get email and context
        const populatedInvoice = await Invoice.findById(invoiceId)
          .populate({
            path: "projectId",
            select: "title clientId",
            populate: { path: "clientId", select: "email" },
          })
          .lean();

        const clientEmail = populatedInvoice?.projectId?.clientId?.email;
        const projectTitle = populatedInvoice?.projectId?.title;
        const amount = populatedInvoice?.amount;
        const currency = populatedInvoice?.currency || "USD";

        if (clientEmail) {
          await sendPaymentReceiptEmail(clientEmail, {
            projectTitle,
            amount,
            currency,
            invoiceId,
            paymentIntentId: session.payment_intent,
            sessionId: session.id,
            paidAt: Date.now(),
          });
        } else {
          console.warn(`No client email found for invoice ${invoiceId}`);
        }
      } catch (err) {
        console.error(`❌ Error handling checkout completion for invoice ${invoiceId}:`, err);
      }
    }
  } else {
    console.error(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};