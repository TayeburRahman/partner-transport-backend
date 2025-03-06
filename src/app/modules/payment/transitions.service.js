const QueryBuilder = require("../../../builder/queryBuilder");
const ApiError = require("../../../errors/ApiError");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const Partner = require("../partner/partner.model");
const User = require("../user/user.model");
const { Transaction, Withdraw, StripeAccount } = require("./payment.model");
const { LogsDashboardService } = require("../logs-dashboard/logsdashboard.service");
const httpStatus = require("http-status");
const Notification = require("../notification/notification.model");
const PaymentService = require("./payment.service");
const { NotificationService } = require("../notification/notification.service");

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
  const { role } = req.user;
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
  } else if (role === ENUM_USER_ROLE.PARTNER) {
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
  // const { amount } = req.query;
  // const { userId, role } = req.user;

  // console.log(amount)

  // if (!amount || isNaN(amount) || Number(amount) <= 0) {
  //   throw new ApiError(400, "Valid amount is required.");
  // } 

  // let user;
  // let roleU;
  // if (role === ENUM_USER_ROLE.PARTNER) {
  //   user = await Partner.findById(userId);
  //   roleU = 'Partner'
  //   if (!user) {
  //     throw new ApiError(404, "Partner not found.");
  //   }
  // } else if (role === ENUM_USER_ROLE.USER) {
  //   user = await User.findById(userId);
  //    roleU = 'User'
  //   if (!user) {
  //     throw new ApiError(404, "User not found.");
  //   }
  // } else {
  //   throw new ApiError(403, "Unauthorized user type.");
  // }
 
  // if (user.wallet < amount) {
  //   throw new ApiError(400, "Insufficient balance for withdrawal.");
  // } 
  // // ----
  // const bankAccount = await StripeAccount.findOne({user: userId})
 
  // if (!bankAccount) {
  //   throw new ApiError(404, "Your bank account details not found! Please update details in your profile.");
  // }  

  // const result = await PaymentService.TransferBalance({bankAccount, amount})

  // if(!result){
  //   throw new ApiError(500, "Error processing your withdrawal. Please try again later.");
  // }
  // // ------
  // user.wallet -= amount;
  // await user.save();
 
  // // --------------
  // const transaction = new Transaction({
  //   payUserType: 'User',
  //   payUser: userId,
  //   receiveUserType: 'User',
  //   receiveUser: userId,
  //   amount: -amount,
  //   partnerAmount: -amount,
  //   paymentMethod: "BankTransfer",
  //   transactionId: result.id,   
  //   paymentStatus: "Completed",
  //   isFinish: true,
  //   payType: "withdraw",
  // });
  // await transaction.save();

  // await NotificationService.sendNotification({
  //   title: {
  //     eng: "Withdrawal Successful!",
  //     span: "¡Retiro Exitoso!"
  //   },
  //   message: {
  //     eng: `You have successfully withdrawn $${amount}. The funds will be transferred to your bank account ending in ${bankAccount.bank_info.account_number.slice(-4)} shortly.`,
  //     span: `Has retirado exitosamente $${amount}. Los fondos se transferirán a tu cuenta bancaria terminada en ${bankAccount.bank_info.account_number.slice(-4)} en breve`
  //   },    
  //   user: userId,
  //   userType: roleU,
  //   types: 'none', 
  // });

  // return transaction;
};

const TransitionsService = {
  transitionsHistory, 
  paymentHistory,
  withdrawRequest, 
}

module.exports = TransitionsService;