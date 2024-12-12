const { Secret } = require("jsonwebtoken");
const config = require("../../config");
const ApiError = require("../../errors/ApiError");
const httpStatus = require("http-status");
const { jwtHelpers } = require("../../helpers/jwtHelpers");
const User = require("../modules/auth/auth.model");
const Admin = require("../modules/admin/admin.model");
const { ENUM_USER_ROLE } = require("../../utils/enums");
const Auth = require("../modules/auth/auth.model");

const auth =
  (...roles) =>
  async (req, res, next) => {
    try {
      const tokenWithBearer = req.headers.authorization; 
      if (!tokenWithBearer) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          "You are not authorized for this role"
        );
      } 
      if (tokenWithBearer.startsWith("Bearer")) {
        const token = tokenWithBearer.split(" ")[1]; 
       // Verify token 
        const verifyUser = jwtHelpers.verifyToken(token, config.jwt.secret); 
        // Set user to headers
        req.user = verifyUser; 
        const isExist = await Auth.findById(verifyUser?.authId);

        if (
          verifyUser.role ===
            Object.values(ENUM_USER_ROLE).includes(verifyUser.role) &&
          !isExist
        ) {
          throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized");
        }

        if (roles.length && !roles.includes(verifyUser.role)) {
          throw new ApiError(
            httpStatus.FORBIDDEN,
            "Access Forbidden: You do not have permission to perform this action"
          );
        }
        
        next();
      }
    } catch (error) {
      next(error);
    }
  };

module.exports = auth;
