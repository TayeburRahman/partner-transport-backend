const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const { SupportService } = require("./support.service");
// ==========================
//  Tickets 
// ==========================
const createTicket = catchAsync(async (req, res) => {
    const result = await SupportService.createTicket(req);
     
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Create ticket successfully!",
      data: result,
    })
  }) 

  const repliedTicket = catchAsync(async (req, res) => {
    const result = await SupportService.repliedTicket(req);
     
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Replay ticket successfully!",
      data: result,
    })
  }) 

   


  const SupportController = { 
    createTicket,
    repliedTicket
  };

  module.exports = { SupportController };