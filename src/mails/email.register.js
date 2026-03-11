const registrationSuccessEmailBody = (userData) => `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 5px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: #333;
          font-size: 24px;
          margin-bottom: 10px;
        }
        h2 {
          color: #333;
          font-size: 20px;
          margin-top: 30px;
        }
        p {
          color: #777;
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 10px;
        }
        .code {
          font-size: 28px;
          font-weight: bold;
          color: #000;
          margin: 15px 0;
        }
      </style>
    </head>

    <body>
      <div class="container">

        <!-- Spanish Section -->
        <h2>Bienvenido a Xmoveit</h2>
        
        <p>Hola ${userData?.user?.name},</p>
        
        <p>Gracias por registrarte en Xmoveit. Para activar tu cuenta, utiliza el siguiente código de activación:</p>
        
        <div class="code">${userData?.activationCode}</div>
        
        <p>Por favor ingresa este código en la página de activación dentro de los próximos 5 minutos.</p>
        
        <p>Si no te registraste en Xmoveit, puedes ignorar este correo.</p>

        <p>Si tienes alguna pregunta, contáctanos en 
        <a href="mailto:contacto@xmoveit.com">contacto@xmoveit.com</a>.</p>

        <hr />

        <!-- English Section -->
        <h2>Welcome to Xmoveit</h2>
        
        <p>Hello ${userData?.user?.name},</p>
        
        <p>Thank you for registering with Xmoveit. To activate your account, please use the following activation code:</p>
        
        <div class="code">${userData?.activationCode}</div>
        
        <p>Please enter this code on the activation page within the next 5 minutes.</p>
        
        <p>If you didn't register for Xmoveit, please ignore this email.</p>

        <p>If you have any questions, please contact us at 
        <a href="mailto:contacto@xmoveit.com">contacto@xmoveit.com</a>.</p>

      </div>
    </body>
  </html>
`;

module.exports = {
  registrationSuccessEmailBody,
};