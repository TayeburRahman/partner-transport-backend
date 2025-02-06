const { AuthService } = require("./auth.service");
const sendResponse = require("../../../shared/sendResponse");
const catchAsync = require("../../../shared/catchasync");
const config = require("../../../config");
const createActivationToken = require("../../../utils/createActivationToken");
// const sendPhoneVerificationsMessage = require("../phone-verify/twilio.verify");

const registrationAccount = catchAsync(async (req, res) => {
  const { role } = await AuthService.registrationAccount(req);
  let message;
  message = role === "USER" && "Please check your email for the activation OTP code."
  message = role === "PARTNER" && "Your account is awaiting admin approval."
  message = role === "ADMIN" || "SUPER_ADMIN" && "Create a new admin successfully."

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message,
    data: role,
  });
});

const activateAccount = catchAsync(async (req, res) => {
  const result = await AuthService.activateAccount(req.body);
  const { refreshToken } = result;

  const cookieOptions = {
    secure: config.env === "production",
    httpOnly: true,
  };
  res.cookie("refreshToken", refreshToken, cookieOptions);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Activation code verified successfully.",
    data: result,
  });
});

const loginAccount = catchAsync(async (req, res) => {
  const loginData = req.body;
  const result = await AuthService.loginAccount(loginData);
  const { refreshToken } = result;

  const cookieOptions = {
    secure: config.env === "production",
    httpOnly: true,
  };
  res.cookie("refreshToken", refreshToken, cookieOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Auth logged in successfully!",
    data: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const passwordData = req.body;
  const user = req.user;
  await AuthService.changePassword(user, passwordData);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password changed successfully!",
  });
});

const forgotPass = catchAsync(async (req, res) => {
  await AuthService.forgotPass(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Check your email!",
  });
});

const checkIsValidForgetActivationCode = catchAsync(async (req, res) => {
  const result = await AuthService.checkIsValidForgetActivationCode(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Code verified successfully",
    data: result,
  });
});

const resendCodeActivationAccount = catchAsync(async (req, res) => {
  const data = req.body;
  const result = await AuthService.resendCodeActivationAccount(data);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Resent successfully",
    data: result,
  });
});

const resendCodeForgotAccount = catchAsync(async (req, res) => {
  const data = req.body;
  const result = await AuthService.resendCodeForgotAccount(data);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Resent successfully",
    data: result,
  });
});

const resendActivationCode = catchAsync(async (req, res) => {
  const data = req.body;
  const result = await AuthService.resendActivationCode(data);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Resent successfully",
    data: result,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  await AuthService.resetPassword(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password has been reset successfully.",
  });
});

const OAuthLoginAccount = catchAsync(async (req, res) => {
  const data = await AuthService.OAuthLoginAccount(req.body);
  let message;
  message = data.role === "USER" && "Please check your email for the activation OTP code."
  message = data.role === "PARTNER" && "Please check your email for the activation OTP code."
  message = data.role === "ADMIN" || "SUPER_ADMIN" && "Create a new admin successfully."

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message,
    data: data,
  });
})


// const phoneVerifications = catchAsync(async (req, res) => {
//    const phoneNumber = req.query.phone;
//    const verifyCode = createActivationToken().activationCode;
//    const message = 'Your verification code is: ' + verifyCode;
//    console.log("Codes",message, phoneNumber);
//    const data = await sendPhoneVerificationsMessage(message, phoneNumber)

//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "Message sent successfully",
//     data: data,
//   });
// });


const AuthController = {
  registrationAccount,
  activateAccount,
  loginAccount,
  changePassword,
  forgotPass,
  resetPassword,
  resendActivationCode,
  checkIsValidForgetActivationCode,
  resendCodeActivationAccount,
  resendCodeForgotAccount,
  OAuthLoginAccount,
  // phoneVerifications
};

module.exports = { AuthController };
