const mongoose = require('mongoose');

// Define a function to handle validation errors
const handleValidationError = (err) => {
  // Extract and map errors from mongoose validation errors
  const errors = Object.values(err.errors).map((el) => {
    return {
      path: el?.path,
      message: el?.message,
    };
  });

  // Join all individual error messages into a single string
  const combinedMessages = errors.map(e => e.message).join(', ');

  const statusCode = 400;
  return {
    statusCode,
    message: `Validation Error: ${combinedMessages}`,
    errorMessages: errors,
  };
};

module.exports = handleValidationError;
