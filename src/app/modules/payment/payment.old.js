//Paypal Refund Payment ------------
const paypalRefundPayment = async (req, res) => {
    const { userId, emailAuth, role } = req.user;
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
  
      const takeFee = (4 / 100) * Number(amount)
      const refundData = {
        amount: {
          total: Number(takeFee),
          currency: "USD",
        }
      };
  
      let user;
      let payUserRole;
      if (role === ENUM_USER_ROLE.USER) {
        user = await User.findById(userId)
        payUserRole = 'User'
      } else if (role === ENUM_USER_ROLE.PARTNER) {
        user = await Partner.findById(userId)
        payUserRole = 'Partner'
      } else if (role === ENUM_USER_ROLE.ADMIN) {
        user = await Admin.findById(userId)
        payUserRole = 'Admin'
      }
  
      let receiveUser;
      let receiveUserRole;
      if (service.mainService === "sell") {
        receiveUser = service.confirmedPartner;
        receiveUserRole = 'User';
      } else if (service.mainService === "move") {
        receiveUser = service.user;
        receiveUserRole = 'Partner';
      } else {
        throw new ApiError(httpStatus.NOT_FOUND, 'invalid service type.');
      }
  
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
        payUser: user._id,
        payUserType: payUserRole,
        receiveUser,
        receiveUserType: receiveUserRole,
        isFinish: true,
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
  
      // log=====
      const newTask = {
        admin: userId,
        email: emailAuth,
        description: `Refund successful: Service ID ${serviceId} refunded an amount of $${amount} via PayPal.`,
        types: "Refund",
        activity: "task",
        status: "Success",
      };
      await LogsDashboardService.createTaskDB(newTask)
      // =====
  
      // Return success response
      return { success: true, transaction: newTransaction };
  
    } catch (error) {
      // log=====
      const newTask = {
        admin: userId,
        email: emailAuth,
        description: `Refund failed: Service ID ${serviceId},  ${error.message || "An unexpected error occurred"}.`,
        types: "Failed",
        activity: "task",
        status: "Error",
      };
      await LogsDashboardService.createTaskDB(newTask)
      // =====
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
    }
  };

  const paypalCheckAndUpdateStatusSuccess = async (req, res) => {
    const { paymentId, PayerID, serviceId, payUser, receiveUser, receiveUserType, payUserType } = req.query; 
  
    if (!paymentId || !PayerID || !serviceId || !payUser || !receiveUser) {
      return { status: "failed", message: "Missing required query parameters." };
    }
  
    try {
      const execute_payment_json = { payer_id: PayerID };
  
      const paymentResult = await new Promise((resolve, reject) => {
        paypal.payment.execute(paymentId, execute_payment_json, async (error, payment) => {
          if (error) {
            console.error('PayPal Payment Execution Error:', error);
            return reject({ status: "failed", message: "Payment execution failed", details: error });
          }
  
          if (payment.state !== 'approved') {
            return reject({ status: "failed", message: "Payment not approved." });
          }
  
          const service = await Services.findById(serviceId);
          if (!service) {
            return reject({
              status: "failed",
              message: "Service not found.",
              text: "Payment succeeded, but the service could not be located. Please contact support."
            });
          }
  
          if (service.paymentStatus === 'paid') {
            const existingTransaction = await Transaction.findOne({ serviceId: service._id });
            return resolve({ status: "success", result: existingTransaction });
          }
  
          const saleId = payment.transactions[0].related_resources[0].sale.id;
  
          service.paymentStatus = 'paid';
          service.paymentMethod = 'PayPal',
          service.transactionId = saleId;
          await service.save();
  
          const transactionData = {
            serviceId,
            payUser,
            payUserType,
            receiveUser,
            receiveUserType,
            paymentMethod: 'PayPal',
            amount: Number(payment.transactions[0].amount.total),
            paymentStatus: "Completed",
            isFinish: false,
            transactionId: saleId,
            payType: service.mainService,
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
  
      console.log("Payment Result:--", paymentResult)
  
      return paymentResult;
    } catch (error) {
      console.error('Error processing PayPal payment:', error);
      return { status: "failed", message: "Payment processing encountered an error." };
    }
  };

  //Paypal Payment ------------
const createCheckoutSessionPaypal = async (req, res) => {
    const { serviceId } = req.body;
    const { userId, role } = req.user;
  
    try {
  
  
      let user;
      let payUserRole;
      if (role === ENUM_USER_ROLE.USER) {
        user = await User.findById(userId)
        payUserRole = 'User'
      } else if (role === ENUM_USER_ROLE.PARTNER) {
        user = await Partner.findById(userId)
        payUserRole = 'Partner'
      } else if (role === ENUM_USER_ROLE.ADMIN) {
        user = await Admin.findById(userId)
        payUserRole = 'Admin'
      }
  
      const service = await Services.findById(serviceId)
      if (!service) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Invalid service ID.');
      }
  
      const packagePrice = Number(service.winBid);
      if (!packagePrice) {
        throw new ApiError(httpStatus.NOT_FOUND, 'No conforming partner for service');
      }
  
      let receiveUser;
      let receiveUserRole;
      if (service.mainService === "sell") {
        receiveUser = service.user;
        receiveUserRole = 'User';
      } else if (service.mainService === "move") {
        receiveUser = service.confirmedPartner;
        receiveUserRole = 'Partner';
      } else {
        throw new ApiError(httpStatus.NOT_FOUND, 'invalid service type.');
      }
  
      // Create payment JSON
      const create_payment_json = {
        "intent": "sale",
        "payer": {
          "payment_method": "paypal"
        },
        "redirect_urls": {
          return_url: `${DOMAIN_URL}/payment/paypal/success?serviceId=${encodeURIComponent(serviceId)}&payUser=${encodeURIComponent(userId)}&payUserType=${encodeURIComponent(payUserRole)}&receiveUser=${encodeURIComponent(receiveUser)}&receiveUserType=${encodeURIComponent(receiveUserRole)}`,
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
        return { url: approvalUrl.href };
      } else {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'No approval URL found');
      }
  
    } catch (error) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Paypal server error: ' + error);
    }
  };