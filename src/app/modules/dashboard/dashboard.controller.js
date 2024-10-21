const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const { DashboardService } = require("../dashboard/dashboard.service");

const getAllUsers = catchAsync(async (req, res) => {
  const result = await DashboardService.getAllUsers(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getUserDetails = catchAsync(async (req, res) => {
  const result = await DashboardService.getUserDetails(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User details retrieved successfully",
    data: result,
  });
});

const blockUnblockUserPartnerAdmin = catchAsync(async (req, res) => {
  const result = await DashboardService.blockUnblockUserPartnerAdmin(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Blocked successfully",
    data: result,
  });
});

const getAllPartner = catchAsync(async (req, res) => {
  const result = await DashboardService.getAllPartner();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Partner retrieval successful",
    data: result,
  });
});

const getPartnerDetails = catchAsync(async (req, res) => {
  const result = await DashboardService.getPartnerDetails(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Partner details retrieved successfully",
    data: result,
  });
});

const deletePartner = catchAsync(async (req, res) => {
  const result = await DashboardService.deletePartner(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Partner deleted successfully",
    data: result,
  });
});

const getAllPendingPartners = catchAsync(async (req, res) => {
  const result = await DashboardService.getAllPendingPartners(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Pending partners retrieved Successfully",
    data: result,
  });
});

const approveDeclinePartner = catchAsync(async (req, res) => {
  const result = await DashboardService.approveDeclinePartner(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Partner profile status changed successfully",
    data: result,
  });
});

const getAllAdmins = catchAsync(async (req, res) => {
  const result = await DashboardService.getAllAdmins(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All admin retrieval successful",
    data: result,
  });
});

const getAdminDetails = catchAsync(async (req, res) => {
  const result = await DashboardService.getAdminDetails(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin details retrieved successfully",
    data: result,
  });
});

const deleteAdmin = catchAsync(async (req, res) => {
  const result = await DashboardService.deleteAdmin(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin deleted successfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const result = await DashboardService.deleteUser(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

const addTermsConditions = catchAsync(async (req, res) => {
  const result = await DashboardService.addTermsConditions(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message ? result.message : "Successful",
    data: result.result ? result.result : result,
  });
});

const getTermsConditions = catchAsync(async (req, res) => {
  const result = await DashboardService.getTermsConditions();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result,
  });
});

const deleteTermsConditions = catchAsync(async (req, res) => {
  const result = await DashboardService.deleteTermsConditions(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Deletion Successful",
    data: result,
  });
});

const addPrivacyPolicy = catchAsync(async (req, res) => {
  const result = await DashboardService.addPrivacyPolicy(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message ? result.message : "Successful",
    data: result.result ? result.result : result,
  });
});

const getPrivacyPolicy = catchAsync(async (req, res) => {
  const result = await DashboardService.getPrivacyPolicy();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful",
    data: result,
  });
});

const deletePrivacyPolicy = catchAsync(async (req, res) => {
  const result = await DashboardService.deletePrivacyPolicy(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Deletion Successful",
    data: result,
  });
});

const getAllAuctions = catchAsync(async (req, res) => {
  const result = await DashboardService.getAllAuctions(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Auction Retrieval Successful",
    data: result,
  });
});

const editMinMaxBidAmount = catchAsync(async (req, res) => {
  const result = await DashboardService.editMinMaxBidAmount(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "minPrice maxPrice update Successful",
    data: result,
  });
});

const totalOverview = catchAsync(async (req, res) => {
  const result = await DashboardService.totalOverview();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Total overview retrieved successfully",
    data: result,
  });
});

const getMonthlyRegistrations = catchAsync(async (req, res) => {
  const result = await DashboardService.getMonthlyRegistrations(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User & Partner growth retrieved successfully",
    data: result,
  });
});

const updateVariable = catchAsync(async (req, res) => {
  const result = await DashboardService.updateVariable(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Variable updated successfully",
    data: result,
  });
});

const DashboardController = {
  getAllUsers,
  getUserDetails,
  deleteUser,
  blockUnblockUserPartnerAdmin,
  getAllPartner,
  getPartnerDetails,
  deletePartner,
  getAllAdmins,
  getAdminDetails,
  deleteAdmin,
  getAllPendingPartners,
  approveDeclinePartner,
  addPrivacyPolicy,
  getPrivacyPolicy,
  deletePrivacyPolicy,
  addTermsConditions,
  getTermsConditions,
  deleteTermsConditions,
  getAllAuctions,
  editMinMaxBidAmount,
  totalOverview,
  getMonthlyRegistrations,
  updateVariable,
};

module.exports = { DashboardController };
