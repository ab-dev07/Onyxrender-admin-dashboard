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
    text: `Payment received for ${projectTitle || "your project"}. Amount: ${currency} ${formattedAmount}. Invoice: ${invoiceId || "N/A"}. Paid at: ${paidDate}.`,
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
  const inviteLink = `${process.env.CLIENT_BASE_URL}/dashboard/register-client/${token}`;

  const mailOption = {
    from: '"OnyxRender" <no-reply@onyxrender.com>', // ✅ better "from" format
    to,
    subject: "You're Invited to OnyxRender!",
    text: `You've been invited to join OnyxRender. Use the following link to register: ${inviteLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        
        <!-- Header -->
        <div style="background: #0f172a; padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">OnyxRender Invitation</h1>
        </div>
        
        <!-- Body -->
        <div style="padding: 24px;">
          <h2 style="color: #0f172a; font-size: 20px;">You're Invited 🎉</h2>
          <p style="font-size: 16px; margin-bottom: 20px;">
            You’ve been invited to join <strong>OnyxRender</strong>. Click the button below to complete your registration.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="background: #2563eb; color: #fff; padding: 14px 28px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block;">
              Join Now
            </a>
          </div>

          <p style="font-size: 14px; color: #666;">
            ⚠️ This link will expire in <strong>10 minutes</strong>. If the button above doesn’t work, copy and paste this URL into your browser:
          </p>
          <p style="font-size: 13px; word-break: break-all; color: #2563eb;">
            ${inviteLink}
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #999;">
          © ${new Date().getFullYear()} OnyxRender. All rights reserved.
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOption);
    console.log("✅ Invitation email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Mail error:", err);
  }
};

module.exports = {
  sendInvitationEmail,
  sendResetEmail,
  sendPaymentReceiptEmail,
};
