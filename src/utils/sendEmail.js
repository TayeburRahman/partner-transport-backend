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


const nodemailer = require('nodemailer');
const config = require('../config');

// const smtpPort = 465;          
// const isSecure = true;             

const smtpPort = 587;
const isSecure = false;       

const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,        
  secure: false,     
  requireTLS: true,     
  auth: {
    user:'apikey',    
    pass: config.smtp.smtp_password,
  } 
});
// transporter.verify((err, success) => {
//   if (err) {
//     console.error('SMTP connect error:', err);
//   } else {
//     console.log('SMTP server is ready to take messages');
//   }
// });

 
console.log("smtp_mail",config.smtp.smtp_mail, config.smtp.NAME )
async function sendEmail({ email, subject, html }) {
  const mailOptions = await transporter.sendMail({
    from: '"Moveit Test" <no-reply@xmoveit.com>',
    to: 'swiftswap123@gmail.com',
    subject: 'SendGrid SMTP works!',
    text: 'If you read this, auth succeeded.'
  });

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('❌ Email send failed:', err);
    throw err;
  }
}

module.exports = { sendEmail };

