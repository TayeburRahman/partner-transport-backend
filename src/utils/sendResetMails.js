const nodemailer = require("nodemailer");
const config = require("../config/index");

async function sendResetEmail(to, html, subject) {
  const transporter = nodemailer.createTransport({
    host: config.smtp.smtp_host,
    port: parseInt(config.smtp.smtp_port),
    auth: {
      user: config.smtp.smtp_mail,
      pass: config.smtp.smtp_password,
    },
  });

  await transporter.sendMail({
    from: config.smtp.smtp_mail,
    to,
    subject: subject ? subject : "Reset Password Code",
    html,
  });
}

module.exports = { sendResetEmail };
