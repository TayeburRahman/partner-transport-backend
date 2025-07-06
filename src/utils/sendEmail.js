// const nodemailer = require("nodemailer");
// const config = require("../config");

// const currentDate = new Date();

// const formattedDate = currentDate.toLocaleDateString("en-US", {
//   year: "numeric",
//   month: "2-digit",
//   day: "2-digit",
// });

// const sendEmail = async (options) => {
//   const transporter = nodemailer.createTransport({
//     host: config.smtp.smtp_host,
//     service: config.smtp.smtp_service,
//     port: parseInt(config.smtp.smtp_port),
//     // secure: true,
//     auth: {
//       user: config.smtp.smtp_mail,
//       pass: config.smtp.smtp_password,
//     },
//   });

//   const { email, subject, html } = options;

//   const mailOptions = {
//     from: `${config.smtp.NAME} <${config.smtp.smtp_mail}>`,
//     to: email,
//     date: formattedDate,
//     signed_by: "xmoveit.com",
//     subject,
//     html,
//   };

//   await transporter.sendMail(mailOptions);
// };

// module.exports = { sendEmail };

const nodemailer = require("nodemailer");
const config = require("../config");  

const currentDate = new Date();
const formattedDate = currentDate.toLocaleDateString("en-US", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});


const sendEmail = async ({ email, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: config.smtp.smtp_host, 
    secure: false,
    port: parseInt(config.smtp.smtp_port),
    auth: {
      user: config.smtp.smtp_mail, 
      pass: config.smtp.smtp_password, 
    },
  });

  const mailOptions = {
    from: 'Xmoveit <noreply@em1068.xmoveit.com>',
    to: email,
    date: formattedDate,
    subject,
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
};

module.exports = { sendEmail };
