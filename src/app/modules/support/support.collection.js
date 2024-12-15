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

  const getTicketDb = catchAsync(async (req, res) => {
    const result = await SupportService.getTicketDb(req);
     
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Replay ticket successfully!",
      data: result,
    })
  }) 

  const getTicketDetails = catchAsync(async (req, res) => {
    const result = await SupportService.getTicketDetails(req);
     
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Ticket get successfully!",
      data: result,
    })
  }) 
   
   


  const SupportController = { 
    createTicket,
    repliedTicket,
    getTicketDb,
    getTicketDetails
  };

  module.exports = { SupportController };