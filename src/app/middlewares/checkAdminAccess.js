const httpStatus = require("http-status");
const ApiError = require("../../errors/ApiError"); 
const Admin = require("../modules/admin/admin.model");
const { LogsDashboardService } = require("../modules/logs-dashboard/logsdashboard.service");

const checkAdminAccess = (...requiredPermissions) => {
    return async (req, res, next) => {
      try {
        console.log("hello=====", requiredPermissions)
        const { userId, emailAuth } = req.user;
        const admin = await Admin.findById(userId);
  
        if (!admin) {
          throw new ApiError(httpStatus.UNAUTHORIZED, "Access denied. You are not authorized.");
        }  

        const hasPermission = requiredPermissions.some((permission) => admin[permission]);
  
        if (!hasPermission) {
          const logTask = {
            admin: userId,
            email: emailAuth,
            description: `Admin with ${emailAuth} attempted to access a resource requiring the following permissions: ${requiredPermissions.join(", ")}.`,
            types: "Failed",
            activity: "reglue",
            status: "Warning",
          };
          await LogsDashboardService.createTaskDB(logTask);
          throw new ApiError(httpStatus.FORBIDDEN, "Access denied. Insufficient permissions.");
        }
        next();
      } catch (error) {
        next(error);
      }
    };
  };
  
  module.exports = checkAdminAccess;
  
