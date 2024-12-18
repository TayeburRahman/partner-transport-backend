const httpStatus = require("http-status");

const ApiError = require("../../../errors/ApiError");
const Auth = require("../auth/auth.model");
const Admin = require("./admin.model");

const updateProfile = async (req) => {
  const { files } = req;
  const { userId, authId } = req.user;

  const data = req.body;
  if (!data) {
    throw new ApiError(400, "Data is missing in the request body!");
  }

  const checkUser = await Admin.findById(userId);
  if (!checkUser) {
    throw new ApiError(404, "User not found!");
  }

  const checkAuth = await Auth.findById(authId);
  if (!checkAuth) {
    throw new ApiError(403, "You are not authorized");
  }

  let profile_image;
  if (files?.profile_image) {
    profile_image = `/images/profile/${files.profile_image[0].filename}`;
  }

  let cover_image;
  if (files?.cover_image) {
    cover_image = `/images/cover/${files.cover_image[0].filename}`;
  }

  const updatedData = {
    ...data,
    ...(profile_image && { profile_image }),
    ...(cover_image && { cover_image }),
  };

  await Auth.findOneAndUpdate(
    { _id: authId },
    { name: updatedData.name },
    { new: true }
  );

  const updateUser = await Admin.findOneAndUpdate({ authId }, updatedData, {
    new: true,
  }).populate("authId");

  return updateUser;
};

const myProfile = async (req) => {
  const { userId } = req.user;
  const result = await Admin.findById(userId).populate("authId");
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
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
  await Admin.deleteOne({ authId: isUserExist._id });
  return await Auth.deleteOne({ email });
};

const getAllAdmin = async () => { 
  const admin = Auth.find({isActive: true, role: "ADMIN"}).select("name email");
  return  admin
};

 

const AdminService = {
  updateProfile,
  myProfile,
  deleteMyAccount,
  getAllAdmin
};

module.exports = { AdminService };
