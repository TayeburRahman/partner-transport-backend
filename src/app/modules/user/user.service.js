const ApiError = require("../../../errors/ApiError");
const User = require("./user.model");
const httpStatus = require("http-status");
const Auth = require("../auth/auth.model");

const updateProfile = async (req) => {
  const { files, body: data } = req;
  const { userId, authId } = req.user;

  if (!Object.keys(data).length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Data is missing in the request body!"
    );
  }

  const checkUser = await User.findById(userId);

  if (!checkUser) {
    throw new ApiError(404, "User not found!");
  }

  const checkAuth = await Auth.findById(authId);
  if (!checkAuth) {
    throw new ApiError(404, "You are not authorized");
  }

  let profile_image = undefined;
  if (files && files.profile_image) {
    profile_image = `/images/profile/${files.profile_image[0].filename}`;
  }

  const updatedData = { ...data };

  const [, updateUser] = await Promise.all([
    Auth.findByIdAndUpdate(
      authId,
      { name: updatedData.name },
      {
        new: true,
      }
    ),
    User.findByIdAndUpdate(
      userId,
      { profile_image, ...updatedData },
      {
        new: true,
      }
    ).populate("authId"),
  ]);
  return updateUser;
};

const getProfile = async (user) => {
  const { userId } = user;
  const result = await User.findById(userId).populate("authId");
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const auth = await Auth.findById(result.authId);
  if (auth.is_block) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are blocked. Contact support");
  }
  console.log(auth);
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
  await User.deleteOne({ authId: isUserExist._id });
  return await Auth.deleteOne({ email });
};

const UserService = {
  getProfile,
  deleteMyAccount,
  updateProfile,
};

module.exports = { UserService };
