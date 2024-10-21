// const { Router } = require("express");
// const auth = require("../../middlewares/auth");
// const { ENUM_USER_ROLE } = require("../../../utils/enums");
// const { PaymentController } = require("./payment.controller");

// const router = Router();

// router.post(
//   "/google-pay",
//   auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.PARTNER),
//   PaymentController.googlePay
// )
// router.post("/stripe/webhook", bodyParser.raw({ type: 'application/json' }), PaymentController.checkAndUpdateStatusByWebhook);

// router.get("/stripe/success", PaymentController.checkAndUpdateStatusAndUpdate);

// router.post("/stripe/create-checkout-session",
//     bodyParser.json(),
//     auth(ENUM_USER_ROLE.USER),
//     PaymentController.createCheckoutSession);

// module.exports = router;
