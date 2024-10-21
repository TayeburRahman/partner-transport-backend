const registrationEmailTemplate = (data, role = "user") => `
  <html>
    <head>
      <style>
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f7f9fc;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .header {
          background-color: #007bff;
          padding: 20px;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          color: #ffffff;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 30px;
          color: #333333;
        }
        .content h2 {
          font-size: 22px;
          color: #333333;
          margin-bottom: 20px;
          font-weight: 600;
        }
        .content p {
          font-size: 16px;
          color: #666666;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .activation-code {
          font-size: 28px;
          color: #007bff;
          font-weight: 700;
          text-align: center;
          margin-bottom: 20px;
        }
        .button-container {
          text-align: center;
          margin: 40px 0;
        }
        .button {
          padding: 12px 30px;
          background-color: #007bff;
          text-decoration: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
        }
        .activate-btn {
          color: #fff;
        }
        .button:hover {
          background-color: #0056b3;
        }
        .footer {
          padding: 20px;
          font-size: 14px;
          color: #999999;
          text-align: center;
          background-color: #f7f9fc;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }
        .footer p {
          margin: 5px 0;
        }
        .footer a {
          color: #007bff;
          text-decoration: none;
        }
        .footer a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Partner Transport</h1>
        </div>
        <div class="content">
          <h2>Hello, ${data?.name || "User"}</h2>
          ${
            role === "admin"
              ? `
            <p>Thank you for registering as an admin with Partner Transport. We are excited to have you on board. As an admin, you have full access to manage the platform.</p>
            <p>If you need assistance, reach out to us at <a href="mailto:thakursaad613@gmail.com">thakursaad613@gmail.com</a>.</p>
            `
              : `
            <p>Thank you for registering with Partner Transport. To activate your account, please use the following activation code:</p>
            <div class="activation-code">${
              data?.activationCode || "XXXXXX"
            }</div>
            <p>Enter this code on the activation page within the next ${
              data.expirationTime
            } minutes. If you don't your account will be deleted from the database and you will need to register again.</p>
            <div class="button-container">
              <a href="https://yourwebsite.com/activate" class="button">
                <span class="activate-btn">Activate Now</span>
              </a>
            </div>
            <p>If you didn't register, ignore this email.</p>
          `
          }
        </div>
        <div class="footer">
          <p>
            &copy; ${new Date().getFullYear()}Partner Transport. All rights reserved.
          </p>
          <p><a href="https://yourwebsite.com/privacy">Privacy Policy</a> | <a href="https://yourwebsite.com/contact">Contact Us</a></p>
        </div>
      </div>
    </body>
  </html>
`;

module.exports = {
  registrationEmailTemplate,
};
