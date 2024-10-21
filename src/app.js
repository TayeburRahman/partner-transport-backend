const express = require("express");
const cors = require("cors");
const globalErrorHandler = require("./app/middlewares/globalErrorHandler");
const routes = require("./app/routes");
const NotFoundHandler = require("./errors/NotFoundHandler");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require("path"); 
const config = require("./config"); 

const app = express();

// CORS configuration
app.use(
  cors({
    origin: [
      "http://192.168.10.16:3000",
      "http://192.168.30.250:3000",
      "http://192.168.10.102:3000",
      "http://103.161.9.133:3003",
      "https://103.161.9.133:3003",
      "http://localhost:3003",
      "http://localhost:5173",
      "http://localhost:3005",
    ],
    credentials: true,
  })
);

// Set views directory and view engine
app.set("views", path.join(__dirname, "./app/views"));  
app.set("view engine", "ejs");
  

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("uploads")); // Serve static files from 'uploads'

// All Routes
app.use("/", routes);


// app.get("/payment/success", async (req, res) => {
//   res.render("index");
// });

// Home route to render index.ejs
app.get("/", async (req, res) => { 
    res.json("Welcome to Partner Transport");
});

// Global Error Handler
app.use(globalErrorHandler);

// Handle not found
app.use(NotFoundHandler.handle);

// Export the app
module.exports = app;
