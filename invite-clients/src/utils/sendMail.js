const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
const sendResetEmail = async (to, token) => {
  const resetLink = `http://localhost:3000/dashboard/reset-password?token=${token}`;
  const mailOption = {
    from: "OnyxRender",
    to,
    subject: "Reset Password ",
    text: `Click the link to Reset Password: ${resetLink}`,
    html: `
      <h2>You're Invited!</h2>
      <p>Click the link below to reset Password:</p>
      <a href="${resetLink}" style="font-size:18px; font-weight:bold; color:#3366cc">Join</a></a>
      <p>This link will expire in 10 minutes.</p>
    `,
  };
  try {
    const info = await transporter.sendMail(mailOption);
    console.log("Message sent:", info.messageId);
  } catch (err) {
    console.error("Mail error:", err);
  }
};

const sendPaymentReceiptEmail = async (to, {
  projectTitle,
  amount,
  currency = "USD",
  invoiceId,
  paymentIntentId,
  sessionId,
  paidAt,
} = {}) => {
  const formattedAmount = typeof amount === "number" ? amount.toFixed(2) : amount;
  const subject = `Payment receipt for ${projectTitle || "your project"}`;
  const paidDate = paidAt ? new Date(paidAt).toLocaleString() : new Date().toLocaleString();

  const html = `
    <div style="font-family:Arial, sans-serif; line-height:1.6;">
      <h2 style="margin-bottom:8px;">Thank you for your payment</h2>
      <p>Your payment has been received successfully.</p>
      <table style="border-collapse:collapse; margin-top:12px;">
        <tr>
          <td style="padding:4px 8px; font-weight:bold;">Project</td>
          <td style="padding:4px 8px;">${projectTitle || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px; font-weight:bold;">Amount</td>
          <td style="padding:4px 8px;">${currency} ${formattedAmount}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px; font-weight:bold;">Paid at</td>
          <td style="padding:4px 8px;">${paidDate}</td>
        </tr>
      </table>
      <p style="margin-top:16px;">If you have any questions, reply to this email.</p>
    </div>
  `;

  const mailOption = {
    from: "OnyxRender",
    to,
    subject,
    text: `Payment received for ${projectTitle || "your project"}. Amount: ${currency} ${formattedAmount}. Invoice: ${invoiceId || "N/A"}. Paid at: ${paidDate}.` ,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOption);
    console.log("Payment receipt sent:", info.messageId);
  } catch (err) {
    console.error("Payment receipt mail error:", err);
  }
};
const sendInvitationEmail = async (to, token) => {
  const inviteLink = `http://localhost:3000/dashboard/register-client?token=${token}`;
  const mailOption = {
    from: "OnyxRender",
    to,
    subject: "Invitation",
    text: `Click the link to join: ${inviteLink}`,
    html: `
      <h2>You're Invited!</h2>
      <p>Click the link below to join:</p>
      <a href="${inviteLink}" style="font-size:18px; font-weight:bold; color:#3366cc">Join</a></a>
      <p>This link will expire in 10 minutes.</p>
    `,
  };
  try {
    const info = await transporter.sendMail(mailOption);
    console.log("Message sent:", info.messageId);
  } catch (err) {
    console.error("Mail error:", err);
  }
};
module.exports = {
  sendInvitationEmail,
  sendResetEmail,
  sendPaymentReceiptEmail,
};
