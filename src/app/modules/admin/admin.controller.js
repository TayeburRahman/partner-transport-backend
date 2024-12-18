const sendResponse = require("../../../shared/sendResponse");
const { AdminService } = require("./admin.service");
const catchAsync = require("../../../shared/catchasync");

const myProfile = catchAsync(async (req, res) => {
  const result = await AdminService.myProfile(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful!",
    data: result,
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const result = await AdminService.updateProfile(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const deleteMyAccount = catchAsync(async (req, res) => {
  const email = req.params.email;
  const result = await AdminService.deleteMyAccount(email);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your admin account deleted successfully",
    data: result,
  });
});

const getAllAdmin = catchAsync(async (req, res) => { 
  const result = await AdminService.getAllAdmin();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Get all successfully",
    data: result,
  });
});

 

const AdminController = {
  updateProfile,
  myProfile,
  deleteMyAccount,
  getAllAdmin
};

module.exports = { AdminController };
