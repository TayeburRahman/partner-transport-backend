const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const { LogsDashboardService } = require("./logsdashboard.service");

const eventsCreationRate = catchAsync(async (req, res) => {
    const result = await LogsDashboardService.eventsCreationRate(req.query);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Success",
      data: result,
    });
  });


  const LogsDashboardController = {
    eventsCreationRate, 
  };
  
  module.exports = { LogsDashboardController };