const QueryBuilder = require("../../../builder/queryBuilder");
const ApiError = require("../../../errors/ApiError");
const { ENUM_SOCKET_EVENT, ENUM_USER_ROLE } = require("../../../utils/enums");
const Admin = require("../admin/admin.model");
const Auth = require("../auth/auth.model");
const { LogsDashboardService } = require("../logs-dashboard/logsdashboard.service");
const { sendNotificationOnesignal } = require("../one-signal/onesignal.notifications");
const Partner = require("../partner/partner.model");
const User = require("../user/user.model");
const Notification = require("./notification.model");



const handleNotification = async (receiverId, role, socket, io) => {
  // get all notifications 
  socket.on(ENUM_SOCKET_EVENT.NOTIFICATION, async (data) => {
    console.log("get all notification:", role, receiverId);

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

const sendNotification = async ({ title, message, user, userType, getId, types, notice }) => {
  try {
    const notification = await Notification.create({
      title,
      user,
      message,
      getId,
      userType,
      types,
      notice
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
    } else if(userType === "Admin") {
      const partnerDb = await Admin.findById(user);
      if (!partnerDb) {
        console.error(`Partner with ID ${user} not found`);
        return;
      }
      authId = partnerDb.authId; 
    }else{
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
    await sendNotificationOnesignal(playerIds, title, message, types, getId, notice);

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
  const query = req.query;
  let notifications;
  if (role === ENUM_USER_ROLE.USER) {
    notifications = new QueryBuilder(Notification.find({ user: userId }), query)
      .sort()
      .paginate()
  } else if (role === ENUM_USER_ROLE.PARTNER) {
    notifications = new QueryBuilder(Notification.find({ user: userId }), query)
      .sort()
      .paginate()
  } else {
    console.error('Invalid role provided');
    throw new ApiError(400, 'Invalid role provided');
  }

  const result = await notifications.modelQuery;
  const meta = await notifications.countTotal();

  return { result, meta };
};

const getAdminNotification = async (req) => { 
  const query = req.query;
  const notifications = new QueryBuilder(Notification.find({ admin: true }), query) 
  const result = await notifications.modelQuery;
  const meta = await notifications.countTotal(); 
  return { result, meta };
};

const getNoticeNotification = async (req, res) => { 
  const { id } = req.params; 
  const notice = await Notification.findById(id); 
  return notice
}

const deleteAdminNotification = async (req) => {
  const { id } = req.params;
  const { userId, emailAuth } = req.user;
 
  if (!id) {
    throw new ApiError(400, "Notification ID is required.");
  }
 
  const deletedNotification = await Notification.findByIdAndDelete(id);
  if (!deletedNotification) {
    throw new ApiError(404, "Notification not found.");
  }

  // Log the deletion activity
  try {
    const logTask = {
      admin: userId,
      email: emailAuth,
      description: `Admin email ${emailAuth} deleted notification with ID ${id}.`,
      types: "Delete",
      activity: "reglue",
      status: "Success",
    };
    await LogsDashboardService.createTaskDB(logTask);
  } catch (logError) {
    console.error("Failed to log activity:", logError);
  }
 
  return {
    message: "Notification deleted successfully.",
    deletedNotification,
  };
};


 

const NotificationService = {
  handleNotification,
  sendNotification,
  emitNotification,
  getUserNotification,
  getNoticeNotification,
  getAdminNotification,
  deleteAdminNotification
};

module.exports = { NotificationService}
