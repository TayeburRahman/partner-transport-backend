const { errorLogger, logger } = require("./shared/logger");
const connectDB = require("./connection/connectDB");
const config = require("./config");
const app = require("./app");
const socket = require("./socket/socket");
const { Server } = require("socket.io"); 

async function main() {
  try {
    await connectDB();
    logger.info(`DB Connected Successfully at ${new Date().toLocaleString()}`);

    const port =
      typeof config.port === "number" ? config.port : Number(config.port);

    // start server
    const server = app.listen(port, config.base_url, () => {
      logger.info(`App listening on http://${config.base_url}:${config.port}`);
    });

    // Set up Socket.IO-----------------
    const socketIO = new Server(server, {
      pingTimeout: 60000,
      cors: {
        origin: [
        "http://localhost:5173",
        "http://192.168.10.26:3000", 
        "http://192.168.10.26:3001",
        "http://192.168.10.26:3002",
        "http://192.168.10.26:3003",
        "http://192.168.10.26:3004",
        "http://192.168.10.26:3005", 
      ]
      },
    });

    socket(socketIO);
    // Assign Socket.IO to globally available.
    global.io = socketIO;
 
    // handle unhandled promise rejections
    process.on("unhandledRejection", (error) => {
      logger.error("Unhandled Rejection:", error);
      process.exit(1);
    });

    // handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      errorLogger.error("Uncaught Exception:", error);
      process.exit(1);
    });

    // handle termination signals
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received");
      server.close(() => process.exit(0));
    });
  } catch (err) {
    errorLogger.error("Main Function Error:", err);
    process.exit(1);
  }
}

// start application
main();
