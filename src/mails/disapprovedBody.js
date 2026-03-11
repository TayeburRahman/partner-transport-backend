const disapprovedBody = (data) => `
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Partner Profile Declined</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f7f9fc;
            margin: 0;
            padding: 0;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            border: 1px solid #e0e0e0;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 20px;
        }
        h2 {
            font-size: 20px;
            margin-top: 25px;
        }
        p {
            font-size: 16px;
            line-height: 1.6;
            color: #555;
            margin: 10px 0;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #999;
        }
        hr{
            margin:40px 0;
        }
    </style>
</head>
<body>
    <div class="container">

        <!-- Spanish Section -->
        <h1>Estado de la solicitud: Rechazada</h1>
        <p>Estimado ${data.name},</p>
        <p>Lamentamos informarte que tu solicitud para el perfil de socio no ha sido aprobada en este momento.</p>
        <p>Si tienes preguntas o necesitas más información, no dudes en contactar a nuestro equipo de soporte. Te recomendamos revisar nuestras directrices y volver a postularte después de realizar los ajustes necesarios.</p>
        <p>Valoramos tu interés y esperamos la posibilidad de trabajar contigo en el futuro.</p>

        <hr/>

        <!-- English Section -->
        <h1>Application Status: Declined</h1>
        <p>Dear ${data.name},</p>
        <p>We regret to inform you that your application for the partner profile has not been approved at this time.</p>
        <p>If you have any questions or need further clarification, please feel free to contact our support team. We encourage you to review our guidelines and reapply after making the necessary adjustments.</p>
        <p>We value your interest and look forward to the possibility of working with you in the future.</p>

        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Xmoveit. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

module.exports = disapprovedBody;