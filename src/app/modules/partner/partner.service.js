const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const Auth = require("../auth/auth.model");
const Partner = require("./partner.model");

const updateProfile = async (req) => {
  const { files, body: data } = req;
  const { authId, userId } = req.user;

  const checkValidDriver = await Partner.findById(userId);
  if (!checkValidDriver) {
    throw new ApiError(404, "You are not authorized");
  }

  const fileUploads = {};

  // Helper function to format file path
  const validateFile = (file, folder) => {
    if (!file || !file[0]) return null;
    return `/images/${folder}/${file[0].filename}`;
  };

  if (files) {
    fileUploads.profile_image = files.profile_image ? validateFile(files.profile_image, "profile") : null;
    fileUploads.licensePlateImage = files.licensePlateImage ? validateFile(files.licensePlateImage, "vehicle-licenses") : null;
    fileUploads.drivingLicenseImage = files.drivingLicenseImage ? validateFile(files.drivingLicenseImage, "driving-licenses") : null;
    fileUploads.vehicleInsuranceImage = files.vehicleInsuranceImage ? validateFile(files.vehicleInsuranceImage, "insurance") : null;
    fileUploads.vehicleRegistrationCardImage = files.vehicleRegistrationCardImage ? validateFile(
      files.vehicleRegistrationCardImage,
      "vehicle-registration"
    ) : null;
    fileUploads.vehicleFrontImage = files.vehicleFrontImage ? validateFile(files.vehicleFrontImage, "vehicle-image") : null;
    fileUploads.vehicleBackImage = files.vehicleBackImage ? validateFile(files.vehicleBackImage, "vehicle-image") : null;
    fileUploads.vehicleSideImage = files.vehicleSideImage ? validateFile(files.vehicleSideImage, "vehicle-image") : null;
  }

  // Remove undefined/null fields
  Object.keys(fileUploads).forEach(
    (key) => fileUploads[key] === null && delete fileUploads[key]
  );

  const updatedUserData = { ...data, ...fileUploads };

  const [auth, result] = await Promise.all([
    Auth.findByIdAndUpdate(
      authId,
      { name: updatedUserData.name },
      { new: true, runValidators: true }
    ),
    Partner.findByIdAndUpdate(userId, updatedUserData, {
      new: true,
      runValidators: true,
    }),
  ]);

  return { auth, result };
};

const getProfile = async (user) => {
  const userId = user.userId;
  const result = await Partner.findById(userId).populate("authId");
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const auth = await Auth.findById(result.authId);
  if (auth.is_block) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are blocked. Contact support");
  }

  return result;
};

const deleteMyAccount = async (payload) => {
  const { email, password } = payload;

  const isUserExist = await Auth.isAuthExist(email);

  if (!isUserExist) {
    throw new ApiError(404, "User does not exist");
  }

  if (
    isUserExist.password &&
    !(await Auth.isPasswordMatched(password, isUserExist.password))
  ) {
    throw new ApiError(402, "Password is incorrect");
  }

  await Partner.deleteOne({ authId: isUserExist._id });
  return await Auth.deleteOne({ email });
};

const PartnerService = {
  getProfile,
  deleteMyAccount,
  updateProfile,
};

module.exports = { PartnerService };
