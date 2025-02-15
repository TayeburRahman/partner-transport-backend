/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-console */
const { Error: mongooseError } = require("mongoose");
const config = require("../../config");

const handleValidationError = require("../../errors/handleValidationError");
const handleCastError = require("../../errors/handleCastError");
const ApiError = require("../../errors/ApiError");
const { JsonWebTokenError, TokenExpiredError } = require("jsonwebtoken");
const httpStatus = require("http-status");

const globalErrorHandler = (error, req, res, next) => {
  config.env === "development"
    ? console.log("globalErrorHandler", error)
    : console.error("globalErrorHandler", error);

  let statusCode = 500;
  let message = "Something went wrong!";
  let errorMessages = [];

  if (error?.name === "ValidationError") {
    const simplifiedError = handleValidationError(error);

    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error instanceof JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid token";
    errorMessages = [
      {
        path: "",
        message: error.message,
      },
    ];
  } else if (error instanceof TokenExpiredError) {
    statusCode = 401;
    message = "Token has expired";
    errorMessages = [
      {
        path: "",
        message: error.message,
      },
    ];
  } else if (error?.name === "CastError") {
    const simplifiedError = handleCastError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error instanceof ApiError) {
    statusCode = error?.statusCode;
    message = error.message;
    errorMessages = error?.message
      ? [
          {
            path: "",
            message: error?.message,
          },
        ]
      : [];
  } else if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyValue)[0];
    message = `${field} must be unique`;
    errorMessages = [
      {
        path: field,
        message: `${field} must be unique`,
      },
    ];
  } else if (error instanceof TypeError) {
    statusCode = 400;
    message = error.message;
    errorMessages = [
      {
        path: "",
        message: error.message,
      },
    ];
  } else if (error instanceof mongooseError) {
    message = error?.message;
    errorMessages = error?.message
      ? [
          {
            path: "",
            message: error?.message,
          },
        ]
      : [];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: config.env !== "production" ? error?.stack : undefined,
  });
};

module.exports = globalErrorHandler;
