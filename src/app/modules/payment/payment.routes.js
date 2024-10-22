const { Router } = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const { PaymentController } = require("./payment.controller");
const bodyParser = require("body-parser");

const router = Router();

router
  // Stripe Payment -------------
  .post("/stripe/create-checkout-session",
    bodyParser.json(),
    auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.PARTNER),
    PaymentController.createCheckoutSessionStripe)
  .get("/stripe/success", PaymentController.stripeCheckAndUpdateStatusSuccess)
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
    PaymentController.paypalRefundPayment)
  // Stripe Refund Payment ------------
  .patch("/stripe/refund_pay",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    PaymentController.stripeRefundPayment)
// Bank Transfer Payment ------------



module.exports = router;
