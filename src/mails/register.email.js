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
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header {
          background-color: #007bff;
          padding: 20px;
          border-radius: 8px 8px 0 0;
          color: #fff;
          text-align: center;
        }
        .content {
          padding: 30px;
        }
        h2 {
          font-size: 20px;
          margin-top: 30px;
        }
        p {
          font-size: 16px;
          color: #666;
          line-height: 1.6;
        }
        .activation-code {
          font-size: 28px;
          color: #007bff;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .button {
          padding: 12px 30px;
          background-color: #007bff;
          text-decoration: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          color: white;
        }
        hr{
          margin:40px 0;
        }
        .footer {
          padding: 20px;
          font-size: 14px;
          color: #999;
          text-align: center;
          background-color: #f7f9fc;
          border-radius: 0 0 8px 8px;
        }
      </style>
    </head>

    <body>
      <div class="container">
        <div class="header">
          <h1>Xmoveit</h1>
        </div>

        <div class="content">

          <!-- Spanish Section -->
          <h2>Hola, ${data?.name || "Usuario"}</h2>

          ${
            role === "admin"
              ? `
            <p>Gracias por registrarte como administrador en Xmoveit. Estamos encantados de tenerte en la plataforma.</p>
            <p>Si necesitas ayuda, contáctanos en <a href="mailto:thakursaad613@gmail.com">thakursaad613@gmail.com</a>.</p>
          `
              : `
            <p>Gracias por registrarte en Xmoveit. Para activar tu cuenta utiliza el siguiente código de activación:</p>

            <div class="activation-code">${data?.activationCode || "XXXXXX"}</div>

            <p>Ingresa este código en la página de activación dentro de los próximos ${data?.expirationTime} minutos. Si no lo haces, tu cuenta será eliminada y tendrás que registrarte nuevamente.</p>

            <div class="button-container">
              <a href="https://yourwebsite.com/activate" class="button">
                Activar cuenta
              </a>
            </div>

            <p>Si no te registraste, puedes ignorar este correo.</p>
          `
          }

          <hr/>

          <!-- English Section -->
          <h2>Hello, ${data?.name || "User"}</h2>

          ${
            role === "admin"
              ? `
            <p>Thank you for registering as an admin with Xmoveit. We are excited to have you on board.</p>
            <p>If you need assistance, contact us at <a href="mailto:thakursaad613@gmail.com">thakursaad613@gmail.com</a>.</p>
          `
              : `
            <p>Thank you for registering with Xmoveit. To activate your account, use the following activation code:</p>

            <div class="activation-code">${data?.activationCode || "XXXXXX"}</div>

            <p>Enter this code on the activation page within the next ${data?.expirationTime} minutes. If you don't, your account will be deleted and you will need to register again.</p>

            <div class="button-container">
              <a href="https://yourwebsite.com/activate" class="button">
                Activate Account
              </a>
            </div>

            <p>If you didn't register, please ignore this email.</p>
          `
          }

        </div>

        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Xmoveit. All rights reserved.</p>
          <p>
            <a href="https://yourwebsite.com/privacy">Privacy Policy</a> |
            <a href="https://yourwebsite.com/contact">Contact Us</a>
          </p>
        </div>

      </div>
    </body>
  </html>
`;

module.exports = {
  registrationEmailTemplate,
};