class NotFoundHandler {
  static handle(req, res, next) {
    res.status(404).json({
      success: false,
      message: 'Not Found',
      errorMessages: [
        {
          path: req.originalUrl,
          message: `This ${req.originalUrl} API Not Found`,
        },
      ],
    });
    next();
  }
}

module.exports = NotFoundHandler;
