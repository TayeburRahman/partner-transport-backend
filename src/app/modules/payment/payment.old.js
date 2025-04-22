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
        active: true,
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
            const existingTransaction = await Transaction.findOne({ serviceId: service._id, active: true });
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
            active: true,
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

  // =======================================
  const updateUserDataOfBank = async (req, res) => {
    try {
      const { userId, role } = req.user;
      const { address, bank_info, business_profile, dateOfBirth } = req.body;
  
      const parsedDob = new Date(dateOfBirth);
      if (isNaN(parsedDob)) {
        throw new ApiError(404, "Invalid date format for dateOfBirth.");
      }
  
      const stripeAccount = await StripeAccount.findOne({ user: userId });
      if (!stripeAccount) {
        throw new ApiError(404, "Stripe account not found.");
      }
  
      const accountId = stripeAccount?.stripeAccountId;
  
      const accountToken = await stripePublic.tokens.create({
        account: {
          individual: {
            address: {
              line1: address.line1,
              city: address.city,
              state: address.state,
              postal_code: address.postal_code,
              country: bank_info.country,
            },
            dob: {
              day: parsedDob.getDate(),
              month: parsedDob.getMonth() + 1,
              year: parsedDob.getFullYear(),
            },
            // phone: address.phone_number,
            metadata: {
              personal_rfc: address.personal_rfc,
            },
          },
        },
      });
  
      await stripe.accounts.update(accountId, {
        account_token: accountToken.id,
        business_profile: {
          name: business_profile?.business_name || "Unknown",
          // url: business_profile?.website || "www.example.com",
          product_description: business_profile?.product_description,
        },
      });
  
      let existingBankAccountId = stripeAccount.externalAccountId;
  
      if (existingBankAccountId) {
        const account = await stripe.accounts.retrieve(accountId);
        const activeBankAccount = account.external_accounts?.data?.find(
          (bank) => bank.id === existingBankAccountId
        );
  
        if (!activeBankAccount) {
          existingBankAccountId = null;
        }
      }
  
      const newBankAccount = await stripe.accounts.createExternalAccount(accountId, {
        external_account: {
          object: "bank_account",
          account_holder_name: bank_info.account_holder_name,
          account_holder_type: bank_info.account_holder_type,
          account_number: bank_info.account_number,
          country: bank_info.country,
          currency: bank_info.currency,
        },
      });
  
      await stripe.accounts.updateExternalAccount(accountId, newBankAccount.id, {
        default_for_currency: true,
      });
  
      if (existingBankAccountId) {
        try {
          await stripe.accounts.deleteExternalAccount(accountId, existingBankAccountId);
        } catch (error) {
          if (error.type === "invalid_request_error" && error.code === "resource_missing") {
          } else {
            throw new ApiError(404, error.message);
          }
        }
      }
  
      const updatedStripeAccount = await StripeAccount.findOneAndUpdate(
        { user: userId },
        {
          address: {
            line1: address.line1,
            city: address.city,
            state: address.state,
            postal_code: address.postal_code,
            country: address.country,
            phone_number: address.phone_number,
            personal_rfc: address.personal_rfc,
          },
          bank_info: {
            account_holder_name: bank_info.account_holder_name,
            account_holder_type: bank_info.account_holder_type,
            account_number: bank_info.account_number,
            country: bank_info.country,
            currency: bank_info.currency,
          },
          business_profile: {
            business_name: business_profile?.business_name || "Unknown",
            website: business_profile?.website || "www.example.com",
            product_description: business_profile?.product_description,
          },
          dateOfBirth: parsedDob,
          externalAccountId: newBankAccount.id,
          updatedAt: new Date(),
        },
        { new: true, upsert: true }
      );
  
      return {
        message: "User data updated successfully!",
        updatedStripeAccount,
      };
    } catch (error) {
      console.error("Error updating user data:", error);
      throw new ApiError(error.statusCode || 500, error.message || "Internal Server Error");
    }
  };


  const createConnectedAccountWithBank = async (req, res) => {
      try {
        const { userId, role } = req.user;
    
        const address = req.body.address;
        const bank_info = req.body.bank_info;
        const business_profile = req.body.business_profile;
        const dob = req.body.dateOfBirth;
    
        // Input validation
        const validationError = validateInputs(address, dob, bank_info, business_profile);
        if (validationError) throw new ApiError(httpStatus.BAD_REQUEST, validationError);
    
        // Find the user
        let existingUser;
        let userType;
        if (role === "USER") {
          userType = "User"
          existingUser = await User.findById(userId);
        } else if (role === "PARTNER") {
          userType = "Partner"
          existingUser = await Partner.findById(userId);
        }
        if (!existingUser) throw new ApiError(httpStatus.NOT_FOUND, `${role} not found.`);
    
        // Handle KYC files and create token in parallel
        const [token] = await Promise.all([
          createStripeToken(existingUser, dob, address, bank_info),
        ]);
    
        // Create the Stripe account
        const account = await createStripeAccount(token, bank_info, business_profile, existingUser, dob);
    
        // Save Stripe account if creation was successful
        if (account.id && account?.external_accounts?.data?.length) {
          const saveData = await saveStripeAccount(account, existingUser, userId, userType, address, dob, business_profile, bank_info);
          return {
            saveData,
            account,
            success: true,
            message: "Account created successfully.",
          };
        } else {
          throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create the Stripe account.");
        }
      } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Internal Server Error");
      }
    };
    const validateInputs = (address, dateOfBirth, bank_info, business_profile) => {
    
      if (
        !address ||
        !address.line1 ||
        !address.city ||
        !address.state ||
        !address.country ||
        !address.postal_code
      ) {
        throw new Error("All address fields are required: line1, city, state, country, postal_code, phone_number, and personal_rfc.");
      }
    
      // Validate date of birth
      if (!dateOfBirth || isNaN(Date.parse(dateOfBirth))) {
        throw new Error("A valid date of birth is required.");
      }
    
      if (
        !bank_info ||
        !bank_info.account_holder_name ||
        !bank_info.account_holder_type ||
        !bank_info.account_number ||
        !bank_info.country ||
        !bank_info.currency
      ) {
        throw new Error("All bank information fields are required: account_holder_name, account_holder_type, account_number, country, and currency.");
      }
    
      // if (
      //   !business_profile ||
      //   !business_profile?.business_name
      // ) {
      //   throw new Error("All business profile fields are required: business_name.");
      // }
      return null;
    };
    const createStripeToken = async (user, dob, address, bank_info) => {
      try {
        // Ensure dob is a valid Date object
        const parsedDob = new Date(dob);
        if (isNaN(parsedDob)) {
          throw new Error("Invalid date format for dob");
        }
    
        return await stripePublic.tokens.create({
          account: {
            individual: {
              dob: {
                day: parsedDob.getDate(),
                month: parsedDob.getMonth() + 1,
                year: parsedDob.getFullYear(),
              },
              first_name: user?.name?.split(" ")[0] || "Unknown",
              last_name: user?.name?.split(" ")[1] || "Unknown",
              email: user?.email,
              phone: address?.phone_number,
              address: {
                city: address.city,
                country: bank_info.country,
                line1: address.line1,
                postal_code: address.postal_code,
                state: address.state,
              },
              metadata: {
                rfc: address.personal_rfc,
                personal_rfc: address.personal_rfc,
              },
            },
            business_type: "individual",
            tos_shown_and_accepted: true,
          },
        });
      } catch (error) {
        console.error("Error creating Stripe token:", error);
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Error creating Stripe token: " + error.message
        );
      }
    };
    const createStripeAccount = async (token, bank_info, business_profile, user, dob) => {
      // console.log("Creating Stripe account",  token, bank_info, business_profile, user)
      try {
        return await stripe.accounts.create({
          type: "custom",
          account_token: token.id,
          capabilities: {
            transfers: { requested: true },
          },
          business_profile: {
            mcc: "5970",
            name: business_profile?.business_name || user.name || "Unknown",
            product_description: business_profile?.product_description,
            // url: business_profile?.website || "www.example.com",
          },
          external_account: {
            object: "bank_account",
            account_holder_name: bank_info.account_holder_name,
            account_holder_type: bank_info.account_holder_type,
            account_number: bank_info.account_number,
            routing_number: bank_info.routing_number,
            country: bank_info.country,
            currency: bank_info.currency,
          },
        });
      } catch (error) {
        console.error("Error creating Stripe account:", error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error creating Stripe account: " + error.message);
      }
    }; 











