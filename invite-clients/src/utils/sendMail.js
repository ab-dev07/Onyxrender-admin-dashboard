const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendInvitationEmail = async (to, code) => {
  console.log("1");
  console.log("Email:", process.env.EMAIL_USER);
  console.log("Pass:", process.env.EMAIL_PASSWORD);

  const mailOption = {
    from: "OnyxRender",
    to,
    subject: "Invitation",
    text: `Here is your invitation code: ${code}`,
    html: `
      <h2>Invitation Code</h2>
      <p>Use the following code to join:</p>
      <div style="font-size:20px; font-weight:bold; color:#333">${code}</div>
      <p>This code will expire in 10 minutes.</p>
    `,
  };
  console.log("2");
  try {
    console.log("3");
    const info = await transporter.sendMail(mailOption);
    console.log("Message sent:", info.messageId);
  } catch (err) {
    console.log("4");
    console.error("Mail error:", err);
  }
};
module.exports = {
  sendInvitationEmail,
};
