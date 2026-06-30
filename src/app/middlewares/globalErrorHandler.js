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
  } else if (error.name === "MulterError") {
    statusCode = 400;
    if (error.code === "LIMIT_FILE_SIZE") {
      message = "El archivo es demasiado grande. El límite es de 5 MB.";
    } else if (error.code === "LIMIT_FILE_COUNT") {
      message = "Has superado el límite de archivos permitidos.";
    } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
      message = `Campo de archivo inesperado: ${error.field || ""}`;
    } else {
      message = `Error de subida de archivos: ${error.message}`;
    }
    errorMessages = [
      {
        path: error.field || "",
        message: message,
      },
    ];
  } else if (error.message === "Invalid file type") {
    statusCode = 400;
    message = "Tipo de archivo no válido. Solo se admiten imágenes (JPEG, JPG, PNG, WEBP) o videos (MP4).";
    errorMessages = [
      {
        path: "",
        message: message,
      },
    ];
  } else if (error.message === "Invalid fieldname") {
    statusCode = 400;
    message = "Nombre de campo de archivo no válido.";
    errorMessages = [
      {
        path: "",
        message: message,
      },
    ];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: config.env !== "production" ? error?.stack : undefined,
  });
};

module.exports = globalErrorHandler;
