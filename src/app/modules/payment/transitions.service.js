const QueryBuilder = require("../../../builder/queryBuilder");
const ApiError = require("../../../errors/ApiError");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const Partner = require("../partner/partner.model");
const User = require("../user/user.model");
const { Transaction, Withdraw } = require("./payment.model");

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
  const query = req.query;
  const {role} = req.user;
  if (!query.receiveUser) {
    throw new ApiError(400, 'User email (receiveUser) is required.');
  }
 
  let wallet;
 
   if (role === ENUM_USER_ROLE.USER) {
   const user = await User.findById(query.receiveUser)
   if (!user) {
    throw new ApiError(404, 'User not found.');
    } 
   wallet = user.wallet;
   }  else if (role === ENUM_USER_ROLE.PARTNER) {
    const user = await Partner.findById(query.receiveUser)
    if (!user) {
      throw new ApiError(404, 'User not found.');
      } 
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
      path: "category",
      select: "_id category",
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

const withdrawRequest = async (req, res) => {
  const { amount } = req.query;
  const { userId, role } = req.user;
 
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    throw new ApiError(400, "Valid amount is required.");
  }
 
  let userType;
  let Model;

  if (role === ENUM_USER_ROLE.PARTNER) {
    userType = "Partner";
    Model = Partner;
  } else if (role === ENUM_USER_ROLE.USER) {
    userType = "User";
    Model = User;
  } else {
    throw new ApiError(403, "Unauthorized role.");
  }
 
  const user = await Model.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }
 
  if (user.wallet < amount) {
    throw new ApiError(400, "Insufficient wallet balance. Current balance is $"+ user.wallet + ".");
  }
 
  const withdraw = new Withdraw({
    request_amount: amount,
    user: userId,
    userType: userType,
  });
  await withdraw.save();

  return { message: "Withdraw request sent successfully." };
};

const withdrawSuccess = async (req, res) => {
  const { bankTransferId, withdrawId } = req.query;
  const { userId, role } = req.user;

  if (!bankTransferId || !withdrawId) {
    throw new ApiError(400, "BankTransfer ID and Withdraw ID are required.");
  } 

  const withdraw = await Withdraw.findById(withdrawId);
  if (!withdraw) {
    throw new ApiError(404, "Withdraw request not found.");
  }

  let user; 
  if (withdraw.userType === "Partner") {
    user = await Partner.findById(withdraw.user);
    if (!user) {
      throw new ApiError(404, "Partner not found.");
    }
  } else if (withdraw.userType === "User") {
    user = await User.findById(withdraw.user);
    if (!user) {
      throw new ApiError(404, "User not found.");
    }
  } else {
    throw new ApiError(403, "Unauthorized user type.");
  }
 
  if (withdraw.request_amount <= 0) {
    throw new ApiError(400, "Invalid withdrawal amount.");
  }
 
  if (user.wallet < withdraw.request_amount) {
    throw new ApiError(400, "Insufficient balance for withdrawal.");
  }
 
  user.wallet -= withdraw.request_amount;
  await user.save();
 
  withdraw.status = "Completed";
  withdraw.bankTransferId = bankTransferId;
  await withdraw.save();

  const transaction = new Transaction({
    payUserType: "Admin",  
    payUser: userId,
    receiveUserType: withdraw.userType,
    receiveUser: withdraw.user,
    amount: -withdraw.request_amount,
    paymentMethod: "BankTransfer",
    transactionId: bankTransferId,
    paymentStatus: "Completed",
    isFinish: true,
    payType: "withdraw",
  });

  await transaction.save();
 
  return { message: "Withdraw request processed successfully." };
};

const userDetailsWithdraw = async (req) => {
  const { withdrawId } = req.query;

  if (!withdrawId) {
    throw new ApiError(400, "Withdraw ID is required.");
  }
 
  const withdraw = await Withdraw.findById(withdrawId);

  if (!withdraw) {
    throw new ApiError(404, "Withdraw request not found.");
  }
 
  let user;
  if (withdraw.userType === "Partner") {
    user = await Partner.findById(withdraw.user).populate('authId');  
  } else {
    user = await User.findById(withdraw.user).populate('authId');   
  }

  if (!user) {
    throw new ApiError(404, "User not found.");
  }
 
  return user;
};


const TransitionsService = {
  transitionsHistory,
  paymentHistory,
  withdrawRequest,
  withdrawSuccess,
  userDetailsWithdraw
}

module.exports = TransitionsService;