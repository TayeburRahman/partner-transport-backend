const sendResponse = require("../../../shared/sendResponse");
const catchAsync = require("../../../shared/catchasync");
const { ServicesService } = require("./services.service");

const createPostDB = catchAsync(async (req, res) => {
  const result = await ServicesService.createPostDB(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Create post successfully",
    data: result,
  });
});

const updatePostDB = catchAsync(async (req, res) => {
  const result = await ServicesService.updatePostDB(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Update post successfully",
    data: result,
  });
});

const getDetails = catchAsync(async (req, res) => {
  const result = await ServicesService.getDetails(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Update post successfully",
    data: result,
  });
});

const getUserPostHistory = catchAsync(async (req, res) => {
  const result = await ServicesService.getUserPostHistory(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Update post successfully",
    meta: result.meta,
    data: result.data,
  });
});

const deletePostDB = catchAsync(async (req, res) => {
  const result = await ServicesService.deletePostDB(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Delete post successfully",
    data: result,
  });
});

// ----------Partner--------------------------------
const searchNearby = catchAsync(async (req, res) => {
  const result = await ServicesService.searchNearby(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Nearby services retrieved successfully",
    data: result,
  });
});

const conformPartner = catchAsync(async (req, res) => {
  const result = await ServicesService.conformPartner(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Offer accepted successfully!",
    data: result,
  });
});

const getServicePostUser = catchAsync(async (req, res) => {
  const result = await ServicesService.getServicePostUser(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Services retrieved successfully",
    data: result,
  });
});

const getUserServicesWithinOneHour = catchAsync(async (req, res) => {
  const result = await ServicesService.getUserServicesWithinOneHour(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Services retrieved successfully",
    data: result,
  });
});

const updateServicesStatus = catchAsync(async (req, res) => {
  const result = await ServicesService.updateServicesStatus(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Status update successfully",
    data: result,
  });
}); 

const rescheduledPostUser = catchAsync(async (req, res) => {
  const result = await ServicesService.rescheduledPostUser(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Request submit successfully!",
    data: result,
  });
});

const rescheduledAction = catchAsync(async (req, res) => {
   const result = await ServicesService.rescheduledAction(req);
    
   sendResponse(res, {
     statusCode: 200,
     success: true,
     message: "Action requested successfully!",
     data: result,
   })
})
 
 

const ServicesController = {
  createPostDB,
  updatePostDB,
  deletePostDB,
  getDetails,
  getUserPostHistory,
  searchNearby, 
  conformPartner,
  getServicePostUser,
  getUserServicesWithinOneHour,
  rescheduledPostUser,
  rescheduledAction,
  updateServicesStatus
};

module.exports = { ServicesController };
