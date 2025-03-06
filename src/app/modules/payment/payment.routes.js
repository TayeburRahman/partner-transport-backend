const { Router } = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE, ENUM_ADMIN_ACCESS } = require("../../../utils/enums");
const { PaymentController } = require("./payment.controller");
const bodyParser = require("body-parser");
const checkAdminAccess = require("../../middlewares/checkAdminAccess");
const { uploadFile } = require("../../middlewares/fileUploader");

const router = Router();

router
  //====================
  // Payments Stripe ------------
  //====================
  .post("/stripe/create-checkout-session",
    bodyParser.json(),
    auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.PARTNER),
    PaymentController.createCheckoutSessionStripe)
  .get("/stripe/success",
    PaymentController.stripeCheckAndUpdateStatusSuccess)
  // Cancel page ------------
  .get("/cancel", PaymentController.paymentStatusCancel)
  // Stripe Refund Payment ------------
  .patch("/stripe/refund_pay",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_AUCTION_MANAGE, ENUM_ADMIN_ACCESS.ACC_TO_AUCTION_EDIT),
    PaymentController.stripeRefundPayment)

  //====================
  // Bank Transfer Payment ------------
  //====================
  .post("/stripe_bank/create",
    auth(ENUM_USER_ROLE.PARTNER, ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUPER_ADMIN),
    PaymentController.createConnectedAccountWithBank)

  .patch("/stripe_bank/update",
    auth(ENUM_USER_ROLE.PARTNER, ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUPER_ADMIN),
    PaymentController.updateUserDataOfBank)

  .get("/stripe_bank/get",
    auth(ENUM_USER_ROLE.PARTNER, ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUPER_ADMIN),
    PaymentController.getUserBankInfo)


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
  // .post("/withdraw",
  //   auth(ENUM_USER_ROLE.PARTNER, ENUM_USER_ROLE.USER),
  //   PaymentController.withdrawRequest
  // )
 




module.exports = router;
