const nodemailer = require("nodemailer");
const config = require("../config/index");

async function sendResetEmail(to, html, subject) {
  const transporter = nodemailer.createTransport({ 
    host: config.smtp.smtp_host, 
    secure: false,
    port: parseInt(config.smtp.smtp_port),
    auth: {
      user: config.smtp.smtp_mail, 
      pass: config.smtp.smtp_password,  
    },
  });

  // await transporter.sendMail({
  //   from: `Xmoveit <noreply@em1068.xmoveit.com>`,
  //   to,
  //   subject: subject ? subject : "Reset Password Code",
  //   html,
  // });

  const mailOptions = {
    from: 'Xmoveit <noreply@em1068.xmoveit.com>',
    to: to, 
    subject: subject ? subject : "Reset Password Code",
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    throw err;
  }
}

module.exports = { sendResetEmail };
