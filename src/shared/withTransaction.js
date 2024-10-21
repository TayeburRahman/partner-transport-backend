// higher order function to manage database operation with transaction
const withTransaction = (fn) => {
  return async (payload) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await fn(payload, session);
      await session.commitTransaction();
      session.endSession();
      return result;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  };
};

module.exports = withTransaction;
