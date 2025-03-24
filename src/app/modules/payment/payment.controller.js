const config = require("../../../config");
const ApiError = require("../../../errors/ApiError");
const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const { StripeAccount } = require("./payment.model");
const PaymentService = require("./payment.service");
const TransitionsService = require("./transitions.service");
const stripe = require("stripe")(config.stripe.stripe_secret_key);

  // Stripe Payment ================
const createCheckoutSessionStripe  = catchAsync(async (req, res) => {
    const result = await PaymentService.createCheckoutSessionStripe(req); 
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Create payment successfully",
      data: result,
    });
  });  

  const stripeCheckAndUpdateStatusSuccess  = catchAsync(async (req, res) => {
    const data = await PaymentService.stripeCheckAndUpdateStatusSuccess(req, res);  
    // if (data.status === "success") {
    //     return res.render("success", { amount: data.result?.amount });
    //   }
    //   return res.render("failed", { message: data.message, text: data.text });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Payment successfully",
      data: data,
    });
  });

  // Cancel page =================
  const paymentStatusCancel  = catchAsync(async (req, res) => {
    const result = await PaymentService.paymentStatusCancel(req, res);  
      // return res.render("cancel");
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Payment Cancel",
        data: result,
      });
  });
 
  // Stripe Refund Payment ===================
  const stripeRefundPayment  = catchAsync(async (req, res) => {
      const result = await PaymentService.stripeRefundPayment(req); 
       sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Refund payment successfully",
        data: result,
      });
  });

 // Bank Transfer Payment ==============
 const createConnectedAccountWithBank  = catchAsync(async (req, res) => {
  const result = await PaymentService.createConnectedAccountWithBank(req); 
   sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Account Create Successfully",
    data: result,
  });
});
const updateUserDataOfBank = catchAsync(async (req, res) => {
  const result = await PaymentService.updateUserDataOfBank(req); 
  sendResponse(res, {
   statusCode: 200,
   success: true,
   message: "Update bank info successfully.",
   data: result,
 });
})

 

const getUserBankInfo = catchAsync(async (req, res) => { 
  const { userId } = req.user;
  const bankAccount = await StripeAccount.findOne({ user: userId });
 
  const stripeAccount = await stripe.accounts.retrieve(bankAccount.stripeAccountId);

  let verification_message
  let sucess_verification = true;

  if (!stripeAccount) {
    sucess_verification=false;
    verification_message="Stripe account not found or invalid.";
  } 

  const externalAccount = stripeAccount.external_accounts.data.find(
    (account) => account.id === bankAccount.externalAccountId
  );

  if (!externalAccount) {
    sucess_verification=false;
    verification_message= "Bank account not found or not linked to Stripe."
  }
 
  if (!stripeAccount.capabilities?.transfers || stripeAccount.capabilities.transfers !== "active") {
    if (stripeAccount.requirements?.disabled_reason === "requirements.pending_verification") {
      sucess_verification=false;
      verification_message="Bank account verification is in progress. Please wait for the verification process to complete.";
     
    } else {
      sucess_verification=false;
      verification_message="Bank account is not eligible for transfers. Please complete bank account verification with valid information."; 
    }
  }
 
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Get successfully.",
    data: { bankAccount, verification_message, sucess_verification },
  });
});

 
  // =============================


// =Transition=================================
const transitionsHistory  = catchAsync(async (req, res) => {
  const result = await TransitionsService.transitionsHistory(req); 
  sendResponse(res, {
   statusCode: 200,
   success: true,
   message: "Transition history get successfully",
   data: result,
 });

}) 

const paymentHistory = catchAsync(async (req, res) => {
  const result = await TransitionsService.paymentHistory(req); 
  sendResponse(res, {
   statusCode: 200,
   success: true,
   message: "Payment history get successfully",
   data: result,
 });
})

const withdrawRequest = catchAsync(async (req, res) => {
  const result = await TransitionsService.withdrawRequest(req); 
  sendResponse(res, {
   statusCode: 200,
   success: true,
   message: "Withdraw request sent successfully.",
   data: result,
 });
})

// const withdrawSuccess = catchAsync(async (req, res) => {
//   const result = await TransitionsService.withdrawSuccess(req); 
//   sendResponse(res, {
//    statusCode: 200,
//    success: true,
//    message: "Withdraw request processed successfully.",
//    data: result,
//  });
// })

// const getWithdraw = catchAsync(async (req, res) => {
//   const result = await TransitionsService.getWithdraw(req); 
//   sendResponse(res, {
//    statusCode: 200,
//    success: true,
//    message: "get successfully.",
//    data: result,
//  });
// }) 
 

 

  const PaymentController = { 
    createCheckoutSessionStripe,
    stripeCheckAndUpdateStatusSuccess,
    getUserBankInfo,
    paymentStatusCancel, 
    stripeRefundPayment,
    createConnectedAccountWithBank, 
    transitionsHistory, 
    paymentHistory,
    withdrawRequest,
    // withdrawSuccess,
    updateUserDataOfBank,
    // getWithdraw
     
  };
  
  module.exports = { PaymentController };

//   module.exports = { createCheckoutSession,checkAndUpdateStatusByWebhook };