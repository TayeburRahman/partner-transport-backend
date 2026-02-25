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
      const now = new Date();
      const mexicoTime = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
 hour12: true,      
  hourCycle: 'h23'
}).format(now);

console.log('Mexico City Time:', mexicoTime);
      logger.info(`App listening on http://${config.base_url}:${config.port}, started at ${now}`);
    });
    //
    // Set up Socket.IO-----------------
    const socketIO = new Server(server, {
      pingTimeout: 60000,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    socket(socketIO); 
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


 
