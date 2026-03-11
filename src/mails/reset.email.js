const resetEmailTemplate = (data) => `
  <html>
    <head>
      <style>
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
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
          color: #ffffff;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          padding: 30px;
        }
        h2 {
          font-size: 18px;
          margin-top: 30px;
        }
        p {
          font-size: 16px;
          color: #666;
          line-height: 1.6;
        }
        .code {
          font-size: 26px;
          color: #007bff;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
        }
        hr{
          margin:40px 0;
        }
        .footer {
          padding: 20px;
          text-align: center;
          background-color: #f7f9fc;
          color: #999;
          border-radius: 0 0 8px 8px;
          font-size: 14px;
        }
      </style>
    </head>

    <body>
      <div class="container">

        <div class="header">
          <h1>Solicitud de restablecimiento de contraseña</h1>
        </div>

        <div class="content">

          <!-- Spanish Section -->
          <h2>Hola, ${data?.name}</h2>

          <p>Hemos recibido una solicitud para restablecer tu contraseña. Utiliza el siguiente código para continuar:</p>

          <div class="code">${data?.verifyCode}</div>

          <p>Este código será válido durante los próximos ${data?.verifyExpire} minutos y solo puede utilizarse una vez.</p>

          <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo o contactar con soporte.</p>

          <p>Gracias,<br>Equipo de soporte</p>

          <hr/>

          <!-- English Section -->
          <h2>Hello, ${data?.name}</h2>

          <p>We have received a request to reset your password. Please use the code below to proceed with resetting your password:</p>

          <div class="code">${data?.verifyCode}</div>

          <p>This code will be valid for the next ${data?.verifyExpire} minutes and can only be used once.</p>

          <p>If you did not request a password reset, please ignore this email or contact support.</p>

          <p>Thank you,<br>The Support Team</p>

        </div>

        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Xmoveit. All rights reserved.</p>
          <p>
            <a href="https://yourwebsite.com/privacy">Privacy Policy</a> |
            <a href="https://yourwebsite.com/contact">Contact Support</a>
          </p>
        </div>

      </div>
    </body>
  </html>
`;

module.exports = {
  resetEmailTemplate,
};