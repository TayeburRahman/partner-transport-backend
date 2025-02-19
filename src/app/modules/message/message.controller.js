const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const { MessageService } = require("./message.service");

const getMessages = catchAsync(async (req, res) => {
  const result = await MessageService.getMessages(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Success",
    data: result,
  });
});

const conversationUser = catchAsync(async (req, res) => {
  const result = await MessageService.conversationUser(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Conversation retrieved successfully",
    data: result,
  });
});
const getMessagesServices = catchAsync(async (req, res) => {
  const result = await MessageService.getMessagesServices(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Message retrieved successfully",
    data: result,
  });
});
 
const MessageController = {
  getMessages,
  conversationUser,
  getMessagesServices
};

module.exports = { MessageController };
