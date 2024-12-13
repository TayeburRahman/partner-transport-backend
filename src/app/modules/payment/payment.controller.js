const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const PaymentService = require("./payment.service");
const TransitionsService = require("./transitions.service");

  // Stripe Payment -------------
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
  // Cancel page ------------
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
  // Paypal Payment -------------
  const createCheckoutSessionPaypal  = catchAsync(async (req, res) => {
    const result = await PaymentService.createCheckoutSessionPaypal(req); 
     sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Create payment successfully",
      data: result,
    });
  });    
  const paypalCheckAndUpdateStatusSuccess  = catchAsync(async (req, res) => {
    const data = await PaymentService.paypalCheckAndUpdateStatusSuccess(req, res);  
    //  if (data.status === "success") {
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
  // Paypal Refund Payment ------------
  const paypalRefundPayment  = catchAsync(async (req, res) => {
    const result = await PaymentService.paypalRefundPayment(req);
     console.log(result);
     sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Refund payment successfully",
      data: result,
    });
  });  
  // Stripe Refund Payment ------------
  const stripeRefundPayment  = catchAsync(async (req, res) => {
      const result = await PaymentService.stripeRefundPayment(req);
       console.log(result);
       sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Refund payment successfully",
        data: result,
      });
  });
  // Stripe Refund Payment ------------
  const stripeTransferPayment = catchAsync(async (req, res) => {
      const result = await PaymentService.stripeTransferPayment(req);
       console.log(result);
       sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Refund payment successfully",
        data: result,
      });
  });

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

const withdrawSuccess = catchAsync(async (req, res) => {
  const result = await TransitionsService.withdrawSuccess(req); 
  sendResponse(res, {
   statusCode: 200,
   success: true,
   message: "Withdraw request processed successfully.",
   data: result,
 });
})

const userDetailsWithdraw = catchAsync(async (req, res) => {
  const result = await TransitionsService.userDetailsWithdraw(req); 
  sendResponse(res, {
   statusCode: 200,
   success: true,
   message: "get successfully.",
   data: result,
 });
})
 
 
 

 

  const PaymentController = { 
    createCheckoutSessionStripe,
    stripeCheckAndUpdateStatusSuccess,
    paymentStatusCancel,
    createCheckoutSessionPaypal,
    paypalCheckAndUpdateStatusSuccess,
    paypalRefundPayment,
    stripeRefundPayment,
    stripeTransferPayment,
    transitionsHistory, 
    paymentHistory,
    withdrawRequest,
    withdrawSuccess,
    userDetailsWithdraw
     
  };
  
  module.exports = { PaymentController };

//   module.exports = { createCheckoutSession,checkAndUpdateStatusByWebhook };