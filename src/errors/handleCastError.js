 const handleCastError = (error) => {
  const errors = [{ path: error.path, message: 'Invalid Id' }];

  const statusCode = 400;
  return {
    statusCode,
    message: 'CastError -> Please Provide Valid ObjectID',
    errorMessages: errors,
  };
};

module.exports = handleCastError;
