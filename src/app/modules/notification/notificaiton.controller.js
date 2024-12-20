const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse"); 
const { NotificationService } = require("./notification.service");

const getUserNotification = catchAsync(async (req, res) => {
  const result = await NotificationService.getUserNotification(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User notification retrieved successfully",
    data: result,
  });
});

const getAdminNotification = catchAsync(async (req, res) => {
  const result = await NotificationService.getAdminNotification(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notification retrieved successfully",
    data: result,
  });
});


const getNoticeNotification = catchAsync(async (req, res) => {
  const result = await NotificationService.getNoticeNotification(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notification retrieved successfully",
    data: result,
  });
});

const deleteAdminNotification = catchAsync(async (req, res) => {
  const result = await NotificationService.deleteAdminNotification(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notification delete successfully",
    data: result,
  });
});

 
 

const notificationController = {
  getUserNotification,
  getAdminNotification,
  getNoticeNotification,
  deleteAdminNotification
};

module.exports = { notificationController };
