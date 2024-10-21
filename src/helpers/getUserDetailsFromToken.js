const httpStatus = require("http-status");
const jwt = require("jsonwebtoken");
const config = require("../config");
const ApiError = require("../errors/ApiError");
const Admin = require("../app/modules/admin/admin.model");
const Driver = require("../app/modules/driver/driver.model");
const User = require("../app/modules/auth/auth.model");

const getUserDetailsFromToken = async (token) => {
  if (!token) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid token");
  }

  // Verify and decode the token
  const decode = await jwt.verify(token, config.jwt.secret);
  let user;
  if (decode?.role && decode?.role === "ADMIN") {
    user = await Admin.findById(decode?.userId);
  }
  if (decode?.role && decode?.role === "DRIVER") {
    user = await Driver.findById(decode?.userId);
  }
  if (decode?.role && decode?.role === "USER") {
    user = await User.findById(decode?.userId);
  }

  return user;
};

module.exports = getUserDetailsFromToken;
