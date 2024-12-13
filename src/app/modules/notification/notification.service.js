const ApiError = require("../../../errors/ApiError");
const { ENUM_SOCKET_EVENT, ENUM_USER_ROLE } = require("../../../utils/enums");
const Auth = require("../auth/auth.model");
const { sendNotificationOnesignal } = require("../one-signal/onesignal.notifications"); 
const Partner = require("../partner/partner.model");
const User = require("../user/user.model");
const Notification = require("./notification.model");

 

const handleNotification = async (receiverId, role, socket, io) => {
    // get all notifications 
    socket.on(ENUM_SOCKET_EVENT.NOTIFICATION, async (data) => { 
      console.log("get all notification:", role , receiverId);

      const filter = role === ENUM_USER_ROLE.USER 
        ? { userId: receiverId } 
        : role === ENUM_USER_ROLE.DRIVER 
          ? { driverId: receiverId } 
          : null; 

        console.log("filter:", filter)
    
      if (filter) {  
        const notifications = await Notification.find(filter);
        console.log(notifications)

        io.to(receiverId).emit(ENUM_SOCKET_EVENT.NOTIFICATION, notifications);
      } else { 
        console.error("Invalid role provided:", role);
      }
    });

  // update seen notifications 
  socket.on(ENUM_SOCKET_EVENT.SEEN_NOTIFICATION, async (data) => { 
    console.log("seen notification:", role , receiverId);
    const filter = role === ENUM_USER_ROLE.USER 
      ? { userId: receiverId } 
      : role === ENUM_USER_ROLE.DRIVER 
        ? { driverId: receiverId } 
        : null; 

    if (filter) { 
      await Notification.updateMany(filter, { $set: { seen: true } });
      const notifications = await Notification.find(filter);

      io.to(receiverId).emit(ENUM_SOCKET_EVENT.NOTIFICATION, notifications);
    } else { 
      console.error("Invalid role provided:", role);
    }
  });
 
};
  
const sendNotification = async ({ title, message, user, userType, getId, types }) => {
  try {  
    const notification = await Notification.create({
      title,
      user,
      message,
      getId,
      userType,
      types,
    });

    let authId;
 
    if (userType === "User") {
      const userDb = await User.findById(user);
      if (!userDb) {
        console.error(`User with ID ${user} not found`);
        return;
      }
      authId = userDb.authId;
    } else if (userType === "Partner") {
      const partnerDb = await Partner.findById(user);
      if (!partnerDb) {
        console.error(`Partner with ID ${user} not found`);
        return;
      }
      authId = partnerDb.authId;
    } else {
      console.error(`Invalid userType: ${userType}`);
      return;
    }

    const authDb = await Auth.findById(authId);
    if (!authDb) {
      console.error(`Auth with ID ${authId} not found`);
      return;
    }

    const playerIds = authDb.playerIds;
    if (!playerIds || playerIds.length === 0) {
      console.error(`No player IDs found for auth ID ${authId}`);
      return;
    } 
    

    // Send notification via OneSignal
    await sendNotificationOnesignal(playerIds, title, message, types, getId);

    return notification;
  } catch (error) {
    console.error("Error sending notification:", {
      error: error.message,
      stack: error.stack,
      title,
      message,
      user,
      userType,
      getId,
      types,
    });
  }
};

const emitNotification = (receiver, notification) => {
  if (global.io) {
    const socketIo = global.io;
    socketIo.to(receiver.toString()).emit(ENUM_SOCKET_EVENT.NEW_NOTIFICATION, notification); 
  } else {
    console.error('Socket.IO is not initialized');
  }
};

const getUserNotification = async (req) => {
    const { userId, role } = req.user;
    let notifications;
    if(role === ENUM_USER_ROLE.USER){
      notifications = await Notification.find({ user:userId });
    }else if(role === ENUM_USER_ROLE.PARTNER){
      notifications = await Notification.find({ user: userId });
    }else{
      console.error('Invalid role provided');
      throw new ApiError(400,'Invalid role provided');
    }
    return notifications;
};

const NotificationService = { 
   handleNotification,
   sendNotification, 
   emitNotification, 
   getUserNotification
  };
  
module.exports = {NotificationService}
