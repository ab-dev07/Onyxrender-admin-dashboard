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
};
