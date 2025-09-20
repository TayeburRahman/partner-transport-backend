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

  // Helper function to validate file exists
  const validateFile = (file, folder) => {
    if (!file || !file[0]) return null;

    const filePath = path.join(__dirname, "..", "public", folder, file[0].filename);
    if (fs.existsSync(filePath)) {
      return `/images/${folder}/${file[0].filename}`;
    }
    return null;
  };

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
