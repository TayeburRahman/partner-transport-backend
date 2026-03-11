const registrationSuccess = (userData) => `
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
          margin-top: 25px;
        }
        p {
          color: #777;
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 10px;
        }
        a {
          color: #007bff;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        hr{
          margin:30px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">

        <!-- Spanish -->
        <h2>Bienvenido al sitio de citas</h2>

        <p>Hola ${userData?.user?.name},</p>

        <p>Gracias por registrarte en nuestro sitio web de citas.</p>

        <p>Si tienes alguna pregunta, por favor contáctanos en 
        <a href="mailto:bdCalling@gmail.com">bdCalling@gmail.com</a>.</p>

        <hr/>

        <!-- English -->
        <h2>Welcome to Dating Website</h2>

        <p>Hello ${userData?.user?.name},</p>

        <p>Thank you for registering with Dating Website.</p>

        <p>If you have any questions, please contact us at 
        <a href="mailto:bdCalling@gmail.com">bdCalling@gmail.com</a>.</p>

      </div>
    </body>
  </html>
`;

module.exports = {
  registrationSuccess,
};