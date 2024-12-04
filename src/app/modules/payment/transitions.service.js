const QueryBuilder = require("../../../builder/queryBuilder");
const ApiError = require("../../../errors/ApiError");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const Partner = require("../partner/partner.model");
const User = require("../user/user.model");
const { Transaction } = require("./payment.model");

const paymentHistory = async (req, res) => {
 
  const query = req.query;

  if (!query.payUser) {
    throw new ApiError(400, 'User email (payUser) is required.');
  }

  const transactions = await new QueryBuilder(Transaction.find()
  .populate({
    path: "receiveUser",
    select: "name email profile_image phone_number"
  })
  .populate({
    path: "payUser",
    select: "name email profile_image phone_number"
  }), query)
    .search([])
    .filter()
    .sort()
    .paginate()
    .fields()
    

  const result = await transactions.modelQuery; 
  const meta = await transactions.countTotal();  
  return { result: result, meta };
};

const transitionsHistory = async (req, res) => {
  const { authId, userId } = req.user;
  const query = req.query;
  if (!query.receiveUser) {
    throw new ApiError(400, 'User email (receiveUser) is required.');
  }

  if (!query.authType) { 
    throw new ApiError(400, 'Auth type (authType) is required.');
  } 
  let wallet;
 
   if (query.authType === ENUM_USER_ROLE.USER) {
   const user = await User.findById(query.receiveUser)
   wallet = user.wallet;
   }  else if (query.authType === ENUM_USER_ROLE.PARTNER) {
    const user = await Partner.findById(query.receiveUser)
    wallet = user.wallet;
   } else {
    throw new ApiError(400, 'Invalid (authType) type.');
   }
 
  const transaction = new QueryBuilder(
    Transaction.find({ isFinish: true })
    .populate({
      path: "receiveUser",
      select: "name email profile_image phone_number"
    })
    .populate({
      path: "payUser",
      select: "name email profile_image phone_number"
    }), query)
      .search([])
      .filter()
      .sort()
      .paginate()
      .fields()

  const result = await transaction.modelQuery;
  const meta = await transaction.countTotal();
  return { result, meta, wallet }
}

const TransitionsService = {
  transitionsHistory,
  paymentHistory
}

module.exports = TransitionsService;