const disapprovedBody = (data) =>
  `
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
                   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                   border: 1px solid #e0e0e0;
               }
               h1 {
                   font-size: 24px;
                   color: #d9534f;
                   margin-bottom: 20px;
               }
               p {
                   font-size: 16px;
                   line-height: 1.6;
                   color: #555;
                   margin: 10px 0;
               }
               .btn-container {
                   margin-top: 20px;
               }
               .btn {
                   display: inline-block;
                   padding: 10px 20px;
                   font-size: 14px;
                   color: #fff;
                   background-color: #0275d8;
                   border-radius: 5px;
                   text-decoration: none;
               }
               .btn-text {
                   color: #fff;
               }
               .btn:hover {
                   background-color: #025aa5;
               }
               .footer {
                   margin-top: 30px;
                   text-align: center;
                   font-size: 12px;
                   color: #999;
               }
           </style>
       </head>
       <body>
           <div class="container">
               <h1>Application Status: Declined</h1>
               <p>Dear ${data.name},</p>
               <p>We regret to inform you that your application for the partner profile has not been approved at this time.</p>
               <p>If you have any questions or need further clarification, please feel free to contact our support team. We encourage you to review our guidelines and reapply after making the necessary adjustments.</p>
               <div class="btn-container">
                    
               </div>
               <p>We value your interest and look forward to the possibility of working with you in the future.</p>
               <div class="footer">
                   <p>&copy; ${new Date().getFullYear()}Xmoveit. All rights reserved.</p>
               </div>
           </div>
       </body>
       </html>`;

module.exports = disapprovedBody;
