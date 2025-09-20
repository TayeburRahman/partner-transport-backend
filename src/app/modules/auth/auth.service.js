const bcrypt = require("bcrypt");
const cron = require("node-cron");
const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const config = require("../../../config");
const { jwtHelpers } = require("../../../helpers/jwtHelpers");
const { sendEmail } = require("../../../utils/sendEmail");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const { sendResetEmail } = require("../../../utils/sendResetMails");
const { logger } = require("../../../shared/logger");
const Auth = require("./auth.model");
const createActivationToken = require("../../../utils/createActivationToken");
const Partner = require("../partner/partner.model");
const User = require("../user/user.model");
const fs = require("fs");
const Admin = require("../admin/admin.model");
const {
  registrationSuccessEmailBody,
} = require("../../../mails/email.register");
const { resetEmailTemplate } = require("../../../mails/reset.email");
const path = require("path");

// Scheduled task to unset activationCode field
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const result = await Auth.updateMany(
      {
        isActive: false,
        expirationTime: { $lte: now },
        activationCode: { $ne: null },
      },
      {
        $unset: { activationCode: "" },
      }
    );

    if (result.modifiedCount > 0) {
      logger.info(
        `Removed activation codes from ${result.modifiedCount} expired inactive users`
      );
    }
  } catch (error) {
    logger.error("Error removing activation codes from expired users:", error);
  }
});

// Scheduled task to unset codeVerify field
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const result = await Auth.updateMany(
      {
        isActive: false,
        verifyExpire: { $lte: now },
      },
      {
        $unset: { codeVerify: false },
      }
    );

    if (result.modifiedCount > 0) {
      logger.info(
        `Removed activation codes from ${result.modifiedCount} expired inactive users`
      );
    }
  } catch (error) {
    logger.error("Error removing activation codes from expired users:", error);
  }
});
 

const registrationAccount = async (req) => {
  const payload = req.body;
  const files = req.files;
  const { role, password, confirmPassword, email, ...other } = payload;

  console.log("=======", role, payload);

  // --- Validations ---
  if (!role || !Object.values(ENUM_USER_ROLE).includes(role)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Valid Role is required!");
  }
  if (!password || !confirmPassword || !email) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Email, Password, and Confirm Password are required!"
    );
  }
  if (password !== confirmPassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Password and Confirm Password didn't match"
    );
  }

  const existingAuth = await Auth.findOne({ email }).lean();
  if (existingAuth?.isActive) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already exists");
  }

  if (existingAuth && !existingAuth.isActive) {
    await Promise.all([
      existingAuth.role === "USER" && User.deleteOne({ authId: existingAuth._id }),
      existingAuth.role === "PARTNER" && Partner.deleteOne({ authId: existingAuth._id }),
      (existingAuth.role === "ADMIN" || existingAuth.role === "SUPER_ADMIN") &&
        Admin.deleteOne({ authId: existingAuth._id }),
      Auth.deleteOne({ email }),
    ]);
  }

  // --- File Upload Validation ---
  const validateFile = (file, folder, allowedTypes = ["image/jpeg", "image/png", "image/jpg"]) => {
    if (!file || !file[0]) return null;

    const { filename, mimetype } = file[0];

    // check mime type
    if (!allowedTypes.includes(mimetype)) {
      throw new ApiError(400, `Invalid file type for ${folder}. Only jpg, jpeg, png allowed.`);
    }

    // // check file exists
    // const filePath = path.join(__dirname, "..", "public", folder, filename);
    // if (!fs.existsSync(filePath)) {
    //   throw new ApiError(400, `File not found: ${filename}`);
    // }

    return `/images/${folder}/${filename}`;
  };

  const fileUploads = {};
  if (files) {
    fileUploads.profile_image = validateFile(files.profile_image, "profile");
    fileUploads.licensePlateImage = validateFile(files.licensePlateImage, "vehicle-licenses");
    fileUploads.drivingLicenseImage = validateFile(files.drivingLicenseImage, "driving-licenses");
    fileUploads.vehicleInsuranceImage = validateFile(files.vehicleInsuranceImage, "insurance");
    fileUploads.vehicleRegistrationCardImage = validateFile(
      files.vehicleRegistrationCardImage,
      "vehicle-registration"
    );
    fileUploads.vehicleFrontImage = validateFile(files.vehicleFrontImage, "vehicle-image");
    fileUploads.vehicleBackImage = validateFile(files.vehicleBackImage, "vehicle-image");
    fileUploads.vehicleSideImage = validateFile(files.vehicleSideImage, "vehicle-image");
  }

  // Remove null values
  Object.keys(fileUploads).forEach(
    (key) => fileUploads[key] === null && delete fileUploads[key]
  );

  // --- Create Auth ---
  const { activationCode } = createActivationToken();
  const auth = {
    role,
    name: other.name,
    email,
    activationCode,
    password,
    expirationTime: Date.now() + 3 * 60 * 1000,
  };

  if (role === "USER" || role === "PARTNER") {
    sendEmail({
      email: auth.email,
      subject: "Activate Your Account",
      html: registrationSuccessEmailBody({
        user: { name: auth.name },
        activationCode,
      }),
    }).catch((error) => console.error("Failed to send email:", error.message));
  }

  if (role === ENUM_USER_ROLE.ADMIN || role === ENUM_USER_ROLE.SUPER_ADMIN) {
    auth.isActive = true;
  }

  const createAuth = await Auth.create(auth);
  if (!createAuth) {
    throw new ApiError(500, "Failed to create auth account");
  }

  other.authId = createAuth._id;
  other.email = email;

  const createData = { ...other, ...fileUploads };

  // --- Role-based user creation ---
  let result;
  switch (role) {
    case ENUM_USER_ROLE.USER:
      result = await User.create(createData);
      break;
    case ENUM_USER_ROLE.ADMIN:
    case ENUM_USER_ROLE.SUPER_ADMIN:
      result = await Admin.create(createData);
      break;
    case ENUM_USER_ROLE.PARTNER:
      result = await Partner.create(createData);
      break;
    default:
      throw new ApiError(400, "Invalid role provided!");
  }

  return { result, role, message: "Account created successfully!" };
};


const activateAccount = async (payload) => {
  const { activation_code, userEmail, playerId } = payload;

  const existAuth = await Auth.findOne({ email: userEmail });
  if (!existAuth) {
    throw new ApiError(400, "User not found");
  }
  if (existAuth.activationCode !== activation_code) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Code didn't match!");
  }

  let auth = null;
  if (existAuth.role === ENUM_USER_ROLE.USER) {
    auth = await Auth.findOneAndUpdate(
      { email: userEmail },
      { isActive: true },
      {
        new: true,
      runValidators: true,
      });
  }

  if (existAuth.role === ENUM_USER_ROLE.PARTNER){
    return { message: "Code verify successfully!", status: "success"}
  }
 
  let result = {};

  if (existAuth.role === ENUM_USER_ROLE.USER) {
    result = await User.findOne({ authId: existAuth._id });
  } else if (
    existAuth.role === ENUM_USER_ROLE.ADMIN ||
    existAuth.role === ENUM_USER_ROLE.SUPER_ADMIN
  ) {
    result = await Admin.findOne({ authId: existAuth._id });
  } else if (existAuth.role === ENUM_USER_ROLE.PARTNER) {
    result = await Partner.findOne({ authId: existAuth._id });
  } else {
    throw new ApiError(400, "Invalid role provided!");
  }

  // -------------- 
  if (!existAuth.playerIds) {
    existAuth.playerIds = [];
  }
  existAuth.playerIds.push(playerId);
  await existAuth.save();
  // ------------

  const accessToken = jwtHelpers.createToken(
    {
      authId: existAuth?._id,
      role: existAuth?.role,
      userId: result?._id,
      emailAuth: result?.email
    },
    config.jwt.secret,
    config.jwt.expires_in
  );

  const refreshToken = jwtHelpers.createToken(
    { authId: existAuth._id, userId: result._id, role: existAuth.role, emailAuth: result.email },
    config.jwt.refresh_secret,
    config.jwt.refresh_expires_in
  );

  return {
    id: auth._id,
    role: auth.role,
    accessToken,
    refreshToken,
    user: result,
  };
};

const loginAccount = async (payload) => {
  const { email, password, playerId } = payload; 

  const isAuth = await Auth.isAuthExist(email);

  if (!isAuth) {
    throw new ApiError(404, "User does not exist");
  }
  if (!isAuth.isActive) {
    throw new ApiError(401, "Please activate your account then try to login");
  }
  if (isAuth.is_block) {
    throw new ApiError(403, "You are blocked. Contact support");
  }
  if (
    isAuth.password &&
    !(await Auth.isPasswordMatched(password, isAuth.password))
  ) {
    throw new ApiError(401, "Password is incorrect");
  }

  const { _id: authId } = isAuth;
  let userDetails;
  let role;
  switch (isAuth.role) {
    case ENUM_USER_ROLE.USER:
      userDetails = await User.findOne({ authId: isAuth?._id })
      role = ENUM_USER_ROLE.USER;
      break;
    case ENUM_USER_ROLE.PARTNER:
      userDetails = await Partner.findOne({ authId: isAuth?._id })
      role = ENUM_USER_ROLE.PARTNER;
      break;
    case ENUM_USER_ROLE.ADMIN:
      userDetails = await Admin.findOne({ authId: isAuth?._id })
      role = ENUM_USER_ROLE.ADMIN;
      break;
    case ENUM_USER_ROLE.SUPER_ADMIN:
      userDetails = await Admin.findOne({ authId: isAuth?._id })
      role = ENUM_USER_ROLE.SUPER_ADMIN;
      break;
    default:
      throw new ApiError(400, "Invalid role provided!");
  }

  if(!userDetails){
    throw new ApiError(500, "User not found");
  }
  // --------------
  isAuth.playerIds = (isAuth.playerIds || []).filter((id) => id !== playerId);
  isAuth.playerIds.push(playerId);
  if (isAuth.playerIds.length > 5) {
    isAuth.playerIds.shift();
  }
  await isAuth.save();

  // ------------ 
  const accessToken = jwtHelpers.createToken(
    { authId, role, userId: userDetails?._id, emailAuth: userDetails.email },
    config.jwt.secret,
    config.jwt.expires_in
  );

  const refreshToken = jwtHelpers.createToken(
    { authId, role, userId: userDetails?._id, emailAuth: userDetails.email },
    config.jwt.refresh_secret,
    config.jwt.refresh_expires_in
  );
  return {
    id: isAuth._id,
    role: isAuth.role,
    accessToken,
    refreshToken,
    user: userDetails,
  };
};

const forgotPass = async (payload) => {
  try { 
    if (!payload?.email) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Email is required!");
    }

    const user = await Auth.findOne(
      { email: payload.email },
      { _id: 1, role: 1, email: 1, name: 1 }
    );

    if (!user) {
      throw new ApiError(httpStatus.BAD_REQUEST, "User not found!");
    }

    const verifyCode = createActivationToken().activationCode;
    const verifyExpire = new Date(Date.now() + 15 * 60 * 1000);

    user.verifyCode = verifyCode;
    user.verifyExpire = verifyExpire;

    await user.save();

    const data = {
      name: user.name,
      verifyCode,
      verifyExpire: Math.round((verifyExpire - Date.now()) / (60 * 1000)),
    };

    try {
      await sendEmail({
        email: payload.email,
        subject: "Password reset code",
        html: resetEmailTemplate(data),
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to send email.");
    }
  } catch (error) {
    console.error("Error in forgotPass:", error);
    throw error;
  }
};

const checkIsValidForgetActivationCode = async (payload) => {
  const account = await Auth.findOne({ email: payload.email });

  if (!account) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Account does not exist!");
  }

  if (account.verifyCode !== payload.code) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid reset code!");
  }

  const currentTime = new Date();
  if (currentTime > account.verifyExpire) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Reset code has expired!");
  }
  const update = await Auth.updateOne(
    { email: account.email },
    { codeVerify: true }
  );
  account.verifyCode = null;
  await account.save();
  return update;
};

const resetPassword = async (req) => {
  const { email } = req.query;
  const { newPassword, confirmPassword } = req.body;

  console.log(" ffdg", email, newPassword, confirmPassword);

  if (newPassword !== confirmPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Passwords do not match");
  }

  const auth = await Auth.findOne({ email }, { _id: 1, codeVerify: 1 });
  if (!auth) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found!");
  }

  if (!auth.codeVerify) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Your OTP is not verified!");
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  const result = await Auth.updateOne(
    { email },
    { password: hashedPassword, codeVerify: false }
  );
  return result;
};

const changePassword = async (user, payload) => {
  const { authId } = user;
  const { oldPassword, newPassword, confirmPassword } = payload;

  if (newPassword !== confirmPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password and confirm password do not match.");
  }

  const isUserExist = await Auth.findById(authId).select("+password");
  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Account does not exist!");
  }

  if (
    isUserExist.password &&
    !(await Auth.isPasswordMatched(oldPassword, isUserExist.password))
  ) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Old password is incorrect.");
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  await Auth.findByIdAndUpdate(authId, { password: hashedPassword });

  return { message: "Password updated successfully." };
};

const resendCodeActivationAccount = async (payload) => {
  const email = payload.email;
  const user = await Auth.findOne({ email });

  if (!user.email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email not found!");
  }

  const activationCode = createActivationToken().activationCode;
  const expiryTime = new Date(Date.now() + 3 * 60 * 1000);
  user.activationCode = activationCode;
  user.verifyExpire = expiryTime;
  await user.save();

  sendResetEmail(
    user.email,
    `<!DOCTYPE html>
     <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Activation Code</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: auto;
                background: white;
                padding: 20px;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            h1 {
                color: #333;
            }
            p {
                color: #555;
                line-height: 1.5;
            }
            .footer {
                margin-top: 20px;
                font-size: 12px;
                color: #999;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Hello, ${user.name}</h1>
            <p>Your activation code is: <strong>${activationCode}</strong></p>
            <p>Please use this code to activate your account. If you did not request this, please ignore this email.</p>
            <p>Thank you!</p>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()}Xmoveit</p>
            </div>
        </div>
    </body>
    </html>
      `
  );
};

const resendCodeForgotAccount = async (payload) => {
  const email = payload.email;

  if (!email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email not found!");
  }
  const user = await Auth.findOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found!");
  }
  const verifyCode = createActivationToken().activationCode;
  const expiryTime = new Date(Date.now() + 3 * 60 * 1000);
  user.verifyCode = verifyCode;
  user.verifyExpire = expiryTime;
  await user.save();

  sendResetEmail(
    user.email,
    `<!DOCTYPE html>
     <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Activation Code</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: auto;
                background: white;
                padding: 20px;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            h1 {
                color: #333;
            }
            p {
                color: #555;
                line-height: 1.5;
            }
            .footer {
                margin-top: 20px;
                font-size: 12px;
                color: #999;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Hello, ${user.name}</h1>
            <p>Your activation code is: <strong>${verifyCode}</strong></p>
            <p>Please use this code to activate your account. If you did not request this, please ignore this email.</p>
            <p>Thank you!</p>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()}Xmoveit</p>
            </div>
        </div>
    </body>
    </html>
      `
  );
};

//OAuth -------------
const OAuthLoginAccount = async (payload) => {
  const { OAuthId, email, name, phone_number, profile_image, role, playerId } = payload;

  let userDetails;
  let accessToken;
  let refreshToken;

  try {
    const isAuth = await Auth.isAuthExist(email);

    if (isAuth && isAuth.isActive) {
      // Retrieve user details based on role
      switch (isAuth.role) {
        case ENUM_USER_ROLE.USER:
          userDetails = await User.findOneAndUpdate(
            { email },
            { ...payload },
            { new: true }
          );
          break;

        case ENUM_USER_ROLE.PARTNER:
          userDetails = await Partner.findOneAndUpdate(
            { email },
            { ...payload },
            { new: true }
          );
          break;

        case ENUM_USER_ROLE.ADMIN:
        case ENUM_USER_ROLE.SUPER_ADMIN:
          userDetails = await Admin.findOneAndUpdate(
            { email },
            { ...payload },
            { new: true }
          );
          break;

        default:
          throw new ApiError(400, "Invalid role provided!");
      }

      if (!userDetails) {
        throw new ApiError(404, "User details not found.");
      }

      await Auth.findOneAndUpdate(
        { _id: isAuth._id },
        { name }
      );

      // Generate tokens
      ({ accessToken, refreshToken } = generateTokens(isAuth, userDetails));

      // -------------- 
      isAuth.playerIds = (isAuth.playerIds || []).filter((id) => id !== playerId);
      isAuth.playerIds.push(playerId);
      if (isAuth.playerIds.length > 5) {
        isAuth.playerIds.shift();
      }
      await isAuth.save();
      // ------------

      return {
        id: isAuth._id,
        role: isAuth.role,
        accessToken,
        refreshToken,
        user: userDetails,
      };
    } else {
      if (isAuth && !isAuth.isActive) {
        await User.deleteOne({ email });
        await Auth.deleteOne({ email });
      }

      const isActive = true;
      const authUser = await Auth.create({
        email,
        password: generateRandomPassword(),
        name,
        phone_number,
        profile_image,
        role,
        OAuthId,
        isActive,
      });

      if (!authUser) {
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Failed to create auth entry."
        );
      }

      payload.authId = authUser._id;
      payload.playerIds = [playerId];

      // Create new user based on role
      let result;
      if (role === ENUM_USER_ROLE.PARTNER) {
        result = await Partner.create(payload);
      } else {
        result = await User.create(payload);
      }

      if (!result) {
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Failed to create user."
        );
      }

      // Generate tokens
      ({ accessToken, refreshToken } = generateTokens(authUser, result));

      return {
        id: authUser._id,
        role: authUser.role,
        accessToken,
        refreshToken,
        user: result,
      };
    }
  } catch (error) {
    throw new ApiError(500, `OAuth Login Error: ${error.message}`);
  }
};

const generateTokens = (authUser, userDetails) => {
  const accessToken = jwtHelpers.createToken(
    {
      authId: authUser._id,
      role: authUser.role,
      userId: userDetails._id,
      emailAuth: authUser.email
    },
    config.jwt.secret,
    config.jwt.expires_in
  );

  const refreshToken = jwtHelpers.createToken(
    {
      authId: authUser._id,
      role: authUser.role,
      userId: userDetails._id,
      emailAuth: authUser.email
    },
    config.jwt.refresh_secret,
    config.jwt.refresh_expires_in
  );

  return { accessToken, refreshToken };
};

const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-10);
};  

const phoneOTPVerifications = async (payload,user) => {
  const {authId, userId, role}= user;
  const findUser = await Auth.findById(authId)
  // console.log("userId", userId)
  let userDb;
  if(role === ENUM_USER_ROLE.PARTNER){
   userDb = await Partner.findById(userId) 
  }else if(role === ENUM_USER_ROLE.USER){
    userDb = await User.findById(userId)
  }

  if(!payload.phone_number || !payload.phone_c_code){
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Phone number and country code are require.");
  }

  if(!userDb){
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "User not found.");
  }

  if(!findUser){
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "User not found.");
  }

  if(findUser?.verifyOtp !== payload?.otp){
    throw new ApiError(httpStatus.FORBIDDEN, "Invalid your OTP.");
  }

  findUser.verifyOtp = null; 
  findUser.otpVerify = true; 
  await findUser.save() 
  userDb.phone_number = payload.phone_number.toString()
  userDb.isPhoneNumberVerified = true;
  userDb.phone_c_code= payload.phone_c_code
  await userDb.save()
  return findUser;
}; 

 
 

const AuthService = {
  registrationAccount,
  loginAccount,
  changePassword,
  forgotPass,
  resetPassword,
  activateAccount,
  checkIsValidForgetActivationCode,
  resendCodeActivationAccount,
  resendCodeForgotAccount,
  OAuthLoginAccount,
  phoneOTPVerifications
};

module.exports = { AuthService };
