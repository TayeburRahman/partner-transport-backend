const { Router } = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE, ENUM_ADMIN_ACCESS } = require("../../../utils/enums");
const { PaymentController } = require("./payment.controller");
const bodyParser = require("body-parser");
const checkAdminAccess = require("../../middlewares/checkAdminAccess");

const router = Router();

router
  //====================
  // Payments Stripe & Paypal ------------
  //====================
  // Stripe Payment -------------
  .post("/stripe/create-checkout-session",
    bodyParser.json(),
    auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.PARTNER),
    PaymentController.createCheckoutSessionStripe)
  .get("/stripe/success",
    PaymentController.stripeCheckAndUpdateStatusSuccess)
  // Cancel page ------------
  .get("/cancel", PaymentController.paymentStatusCancel)
  // Paypal Payment ------------
  .post("/paypal/create-checkout-session",
    auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.PARTNER),
    PaymentController.createCheckoutSessionPaypal)
  .get("/paypal/success", PaymentController.paypalCheckAndUpdateStatusSuccess)
  // Paypal Refund Payment ------------
  .patch("/paypal/refund_pay",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_AUCTION_MANAGE, ENUM_ADMIN_ACCESS.ACC_TO_AUCTION_EDIT),
    PaymentController.paypalRefundPayment)
  // Stripe Refund Payment ------------
  .patch("/stripe/refund_pay",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_AUCTION_MANAGE, ENUM_ADMIN_ACCESS.ACC_TO_AUCTION_EDIT),
    PaymentController.stripeRefundPayment)
  // Stripe Payment -------------
  .patch("/stripe/transfer",
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_TRANSACTION, ENUM_ADMIN_ACCESS.ACC_TO_EDIT),
    PaymentController.stripeTransferPayment)

  //====================
  // Bank Transfer Payment ------------
  //====================
  
  //====================
  // Get Transition History ------------
  //====================
  .get("/history-transaction",
    auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.PARTNER, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    PaymentController.transitionsHistory
  ) 
  .get("/history-payment",
    auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.PARTNER, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    PaymentController.paymentHistory
  )
  // =============================
  // Withdraw 
  // =============================
  .post("/withdraw",
    auth(ENUM_USER_ROLE.PARTNER, ENUM_USER_ROLE.USER), 
    PaymentController.withdrawRequest
  ) 
  .patch("/withdraw-success",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_BANK_TRANSFER_EDIT),
    PaymentController.withdrawSuccess
  )
  // .get("/withdraw-user-details",
  //   auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  //   PaymentController.userDetailsWithdraw
  // )
  .get("/withdraw",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_BANK_TRANSFER),
    PaymentController.getWithdraw
  ) 
   

   

module.exports = router;
