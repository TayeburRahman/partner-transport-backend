const sendResponse = require("../../../shared/sendResponse");
const catchAsync = require("../../../shared/catchasync");
const { PartnerService } = require("./partner.service");

const updateProfile = catchAsync(async (req, res) => {
  const result = await PartnerService.updateProfile(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const getProfile = catchAsync(async (req, res) => {
  const result = await PartnerService.getProfile(req.user);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});

const deleteMyAccount = catchAsync(async (req, res) => {
  await PartnerService.deleteMyAccount(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Account deleted!",
  });
});

const PartnerController = {
  deleteMyAccount,
  getProfile,
  updateProfile,
};

module.exports = { PartnerController };
