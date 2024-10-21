const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const PaymentService = require("./payment.service2");

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
    if (data.status === "success") {
        return res.render("success", { amount: data.result?.amount });
      }
      return  res.render("failed", { message: data.message });
  });

  // Cancel page ------------
  const paymentStatusCancel  = catchAsync(async (req, res) => {
    const result = await PaymentService.paymentStatusCancel(req, res);  
      return res.render("cancel");
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
     if (data.status === "success") {
        return res.render("success", { amount: data.result?.amount });
      }
      return res.render("failed", { message: data.message });
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
      // const result = await PaymentService.stripeRefundPayment(req);
      //  console.log(result);
      //  sendResponse(res, {
      //   statusCode: 200,
      //   success: true,
      //   message: "Refund payment successfully",
      //   data: result,
      // });
    });

 

  const PaymentController = { 
    createCheckoutSessionStripe,
    stripeCheckAndUpdateStatusSuccess,
    paymentStatusCancel,
    createCheckoutSessionPaypal,
    paypalCheckAndUpdateStatusSuccess,
    paypalRefundPayment,
    stripeRefundPayment
     
  };
  
  module.exports = { PaymentController };

//   module.exports = { createCheckoutSession,checkAndUpdateStatusByWebhook };