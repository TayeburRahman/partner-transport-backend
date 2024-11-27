const httpStatus = require("http-status");
const ApiError = require("../../errors/ApiError"); 
const Admin = require("../modules/admin/admin.model");

const checkAdminAccess = (...requiredPermissions) => {
    return async (req, res, next) => {
      try {
        // console.log("hello", requiredPermissions)
        const { userId } = req.user;
        const admin = await Admin.findById(userId);
  
        if (!admin) {
          throw new ApiError(httpStatus.UNAUTHORIZED, "Access denied. You are not authorized.");
        }
  
        const hasPermission = requiredPermissions.some((permission) => admin[permission]);
  
        if (!hasPermission) {
          throw new ApiError(httpStatus.FORBIDDEN, "Access denied. Insufficient permissions.");
        }
        next();
      } catch (error) {
        next(error);
      }
    };
  };
  
  module.exports = checkAdminAccess;
  
