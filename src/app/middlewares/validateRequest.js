const validateRequest = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
      cookies: req.cookies,
      files: req.files,
    });
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validateRequest;
