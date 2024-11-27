const httpStatus = require("http-status");
const Partner = require("../partner/partner.model");
const User = require("../user/user.model");
const Services = require("../services/services.model");
const { ENUM_PAYMENT_STATUS, ENUM_USER_ROLE } = require("../../../utils/enums");
const config = require("../../../config");
const ApiError = require("../../../errors/ApiError");
const { Transaction } = require("./payment.model");
const { assign } = require("nodemailer/lib/shared");
const stripe = require("stripe")(config.stripe.stripe_secret_key);
const paypal = require('paypal-rest-sdk');
const express = require('express');



const DOMAIN_URL = process.env.RESET_PASS_UI_LINK;
paypal.configure({
  'mode': config.paypal.paypal_mode,
  'client_id': config.paypal.paypal_client_id,
  'client_secret': config.paypal.paypal_client_secret_key
}); 
// Stripe Payment -------------
const createCheckoutSessionStripe = async (req) => {
  try {
    const { serviceId } = req.body
    const { userId, role } = req.user

    let user;
    if (role === ENUM_USER_ROLE.USER) {
      user = await User.findById(userId)
    } else if (role === ENUM_USER_ROLE.PARTNER) {
      user = await Partner.findById(userId)
    }
    const service = await Services.findById(serviceId)
    if (!service) {
      throw new ApiError(httpStatus.NOT_FOUND, 'invalid service ID.');
    }

    const packagePrice = Number(service.winBid);
    if (!packagePrice) {
      throw new ApiError(httpStatus.NOT_FOUND, 'No conform the partner for service');
    }

    const unitAmount = packagePrice * 100;

    let session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${DOMAIN_URL}/payment/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${DOMAIN_URL}/cancel`,
      customer_email: `${user.email}`,
      client_reference_id: serviceId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: unitAmount,
            product_data: {
              name: service.service,
              description: service.description
            }
          },
          quantity: 1
        }
      ]
    })

    return {url: session.url};

  } catch (error) {
    throw new ApiError(400, error);
  }
};
const stripeCheckAndUpdateStatusSuccess = async (req, res) => {
  const sessionId = req.query.session_id;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      return {
        status: "failed",
        message: "Payment execution failed",
      };
    }

    if (session.payment_status !== 'paid') {
      return {
        status: "failed",
        message: "Payment not approved",
      };
    }

    const serviceId = session.client_reference_id;
    const service = await Services.findById(serviceId);

    if (!service) {
      return {
        status: "failed",
        message: "Service not found!",
        text: 'Payment is Success! but the service you are could not be found. Please contact support.'
      }
    }

    // if (service.paymentStatus === 'paid') {
    //   const existingTransaction = await Transaction.findOne({ serviceId: service._id });
    //   return { status: "success", result: existingTransaction };
    // }

    // Update payment status for the service
    service.paymentStatus = 'paid';
    service.transactionId = session.payment_intent;
    await service.save();

    const transactionData = {
      serviceId,
      userId: service.user,
      partnerId: service.confirmedPartner,
      paymentMethod: 'Stripe',
      amount: Number(session.amount_total) / 100,
      paymentStatus: "Completed",
      transactionId: session.payment_intent,
      paymentDetails: {
        email: session.customer_email,
        payId: sessionId,
        currency: "USD"
      }
    };

    const newTransaction = await Transaction.create(transactionData);

    return { status: "success", result: newTransaction };

  } catch (error) {
    console.error('Error processing payment:', error);
    return { status: "failed", message: "Payment execution failed" }
  }
};
// Paypal Payment ------------
const createCheckoutSessionPaypal = async (req, res) => {
  const { serviceId } = req.body;
  const { userId, role } = req.user;

  try {


    let user;
    if (role === ENUM_USER_ROLE.USER) {
      user = await User.findById(userId);
    } else if (role === ENUM_USER_ROLE.PARTNER) {
      user = await Partner.findById(userId);
    }

    const service = await Services.findById(serviceId);
    if (!service) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Invalid service ID.');
    }

    const packagePrice = Number(service.winBid);
    if (!packagePrice) {
      throw new ApiError(httpStatus.NOT_FOUND, 'No conforming partner for service');
    }

    // Create payment JSON
    const create_payment_json = {
      "intent": "sale",
      "payer": {
        "payment_method": "paypal"
      },
      "redirect_urls": {
        "return_url": `${DOMAIN_URL}/payment/paypal/success?serviceId=${serviceId}&userId=${userId}`,
        "cancel_url": `${DOMAIN_URL}/cancel`,
      },
      "transactions": [{
        "item_list": {
          "items": [{
            "name": service.service,
            "sku": "001",
            "price": packagePrice.toFixed(2),
            "currency": "USD",
            "quantity": 1
          }]
        },
        "amount": {
          "currency": "USD",
          "total": packagePrice.toFixed(2)
        },
        "description": service.description
      }]
    };

    // Create PayPal payment
    const payment = await new Promise((resolve, reject) => {
      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          return reject(new ApiError(httpStatus.BAD_REQUEST, 'Paypal API error: ' + error));
        } else {
          return resolve(payment);
        }
      });
    });

    // Find the approval URL
    const approvalUrl = payment.links.find(link => link.rel === 'approval_url');
    if (approvalUrl) {
      return {url: approvalUrl.href};
    } else {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'No approval URL found');
    }

  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Paypal server error: ' + error);
  }
};
const paypalCheckAndUpdateStatusSuccess = async (req, res) => {
  const { paymentId, PayerID, serviceId, userId } = req.query;

  try {
    const execute_payment_json = {
      "payer_id": PayerID,
    };

    const paymentResult = await new Promise((resolve, reject) => {
      paypal.payment.execute(paymentId, execute_payment_json, async (error, payment) => {
        if (error) {
          return reject({ status: "failed", message: "Payment execution failed" });
        }

        // Verify payment status
        if (payment.state !== 'approved') {
          return reject({ status: "failed", message: "Payment not approved" });
        }

        const service = await Services.findById(serviceId);
        if (!service) {
          return reject({
            status: "failed",
            message: "Service not found!",
            text: "Payment is Success! but the service you are could not be found. Please contact support"
          });
        }

        // if (service.paymentStatus === 'paid') {
        //   const existingTransaction = await Transaction.findOne({ serviceId: service._id });
        //   return resolve({ status: "success", result: existingTransaction });
        // }

        const saleId = payment.transactions[0].related_resources[0].sale.id;

        // Update payment status for the service
        service.paymentStatus = 'paid';
        service.transactionId = saleId;
        await service.save();

        const transactionData = {
          serviceId,
          userId: service.user,
          partnerId: service.confirmedPartner,
          paymentMethod: 'PayPal',
          amount: Number(payment.transactions[0].amount.total),
          paymentStatus: "Completed",
          transactionId: saleId,
          paymentDetails: {
            email: payment.payer.payer_info.email,
            payId: paymentId,
            currency: payment.transactions[0].amount.currency,
          },
        };

        const newTransaction = await Transaction.create(transactionData);
        resolve({ status: "success", result: newTransaction });
      });
    });
    return paymentResult

  } catch (error) {
    console.error('Error processing PayPal payment:', error);
    return { status: "failed", message: "Payment execution failed" };;
  }
};

// Cancel page ------------
const paymentStatusCancel = async (req, res) => {
  return { status: "canceled" }
}

// Paypal Refund Payment ------------
const paypalRefundPayment = async (req, res) => {
  const { saleId, amount, serviceId } = req.body;
  try {

    if (!paymentIntentId || !amount || !serviceId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Missing required parameters!");
    }

    const service = await Services.findById(serviceId);

    if (!service) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Service not found!");
    }
    if (service.paymentStatus === 'refunded') {
      throw new ApiError(httpStatus.BAD_REQUEST, "Service is already refunded!");
    }
    if (service.paymentStatus !== 'paid') {
      throw new ApiError(httpStatus.BAD_REQUEST, "Service is not paid!");
    }

    const takeFee = (4 / 100) * Number(amount)
    const refundData = {
      amount: {
        total: Number(takeFee),
        currency: "USD",
      }
    };
    const refund = await new Promise((resolve, reject) => {
      paypal.sale.refund(saleId, refundData, (error, refund) => {
        if (error) {
          reject(error.response?.message)
          return;
        }
        resolve(refund);
      });
    });

    service.paymentStatus = 'refunded';
    await service.save();

    const transactionData = {
      serviceId,
      userId: service.user,
      partnerId: service.confirmedPartner,
      paymentMethod: 'PayPal',
      amount: Number(refund.amount.total),
      paymentStatus: "Refunded",
      transactionId: saleId,
      paymentDetails: {
        // email: refund?.payer?.payer_info?.email,
        payId: refund.parent_payment,
        currency: refund.amount.currency,
      },
    };
 
    const newTransaction = await Transaction.create(transactionData);

    // Return success response
    return { success: true, transaction: newTransaction };

  } catch (error) {
    // console.error("Refund error:", error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};
// Stripe Refund Payment ------------
const stripeRefundPayment = async (req, res) => {
  const { saleId, amount, serviceId } = req.body;

  try {
    if (!saleId || !amount || !serviceId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Missing required parameters!");
    }
    const service = await Services.findById(serviceId);
    if (!service) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Service not found!");
    }
    if (service.paymentStatus === 'refunded') {
      throw new ApiError(httpStatus.BAD_REQUEST, "Service is already refunded!");
    }
    if (service.paymentStatus !== 'paid') {
      throw new ApiError(httpStatus.BAD_REQUEST, "Service is not paid!");
    }
    // const takeFee = (4 / 100) * Number(amount)

    const refund = await stripe.refunds.create({
      payment_intent: saleId,
      amount: Math.round(amount * 100),
      // currency: 'usd',
    });

    service.paymentStatus = 'refunded';
    await service.save();

    const transactionData = {
      serviceId,
      userId: service.user,
      partnerId: service.confirmedPartner,
      paymentMethod: 'Stripe',
      amount: Number(refund.amount) / 100,
      paymentStatus: "Refunded",
      transactionId: refund.id,
      paymentDetails: {
        payId: refund.charge,
        currency: refund.currency,
      },
    };

    const newTransaction = await Transaction.create(transactionData);

    return  { success: true, transaction: newTransaction };

  } catch (error) {
    console.error("Refund error:", error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to process refund.");
  }
};

const stripeTransferPayment = (req, res) => {
  // Implement Bank Transfer Payment logic here  
  return
}

const transferPayments = async(req, res) => {
  // Implement Bank Transfer Payment logic here  

  // const transactionData = {
  //   serviceId,
  //   userId: service.user,
  //   partnerId: service.confirmedPartner,
  //   paymentMethod: 'Stripe',
  //   amount: Number(refund.amount) / 100,
  //   paymentStatus: "Refunded",
  //   transactionId: refund.id,
  //   paymentDetails: {
  //     payId: refund.charge,
  //     currency: refund.currency,
  //   },
  // };

  // const newTransaction = await Transaction.create(transactionData);

  return
}


// Bank Transfer Payment ------------
const PaymentService = {
  // createConnectedAccountWithBank,
  createCheckoutSessionStripe,
  paypalCheckAndUpdateStatusSuccess,
  paymentStatusCancel,
  createCheckoutSessionPaypal,
  stripeCheckAndUpdateStatusSuccess,
  paypalRefundPayment,
  stripeRefundPayment,
  transferPayments,
  stripeTransferPayment
}

module.exports = PaymentService;

