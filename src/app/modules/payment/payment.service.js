const httpStatus = require("http-status");
const Partner = require("../partner/partner.model");
const User = require("../user/user.model");
const Services = require("../services/services.model");
const { ENUM_USER_ROLE, ENUM_SERVICE_STATUS } = require("../../../utils/enums");
const config = require("../../../config");
const ApiError = require("../../../errors/ApiError");
const { Transaction, StripeAccount } = require("./payment.model");
const stripe = require("stripe")(config.stripe.stripe_secret_key);
const { LogsDashboardService } = require("../logs-dashboard/logsdashboard.service");
const Admin = require("../admin/admin.model");
const Variable = require("../variable/variable.model");
const VariableCount = require("../variable/variable.count");
const { ServicesService } = require("../services/services.service");
const { Bids } = require("../bid/bid.model");
const { NotificationService } = require("../notification/notification.service");
const { default: mongoose } = require("mongoose");

const DOMAIN_URL = process.env.RESET_PASS_UI_LINK;

//Stripe Payment =====================
const createCheckoutSessionStripe = async (req) => {
  try {
    const { serviceId, price, currency, partnerId } = req.body;
    const { userId, role } = req.user;
 
    if (!currency || !Number(price) || !serviceId || !partnerId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields.');
    } 

      const partner = await Partner.findOne({ _id: partnerId }); 
      if (!partner) {
        throw new ApiError( 404,  "Partner account is Deactivated, please find another partner." );
      }
      const service = await Services.findById(serviceId); 
      if (!service) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Invalid service ID.');
      }

        const bidDetails = await Bids.findOne({
          service: serviceId,
          partner: partnerId,
        });

        if (!bidDetails?.price) {
          throw new ApiError(404, "Bid not found for this service and partner.");
        }

      
    let user;
    let payUserRole;
    if (role === ENUM_USER_ROLE.USER) {
      user = await User.findById(userId);
      payUserRole = 'User';
    } else if (role === ENUM_USER_ROLE.PARTNER) {
      user = await Partner.findById(userId);
      payUserRole = 'Partner';
    } else if (role === ENUM_USER_ROLE.ADMIN) {
      user = await Admin.findById(userId);
      payUserRole = 'Admin';
    }
 
    // if (!service?.winBid) {
    //   throw new ApiError(404, "No Partner accepted yat!");
    // }

    console.log("partnerId",partnerId)

    let receiveUser;
    let receiveUserRole;
    if (service.mainService === "sell") {
      receiveUser = service.user;
      receiveUserRole = 'User';
    } else if (service.mainService === "move") {
      receiveUser = new mongoose.Types.ObjectId(partnerId);
      receiveUserRole = 'Partner';
    } else {
      throw new ApiError(httpStatus.NOT_FOUND, 'Invalid service type.');
    }
 
    const bankAccount = await StripeAccount.findOne({ user: receiveUser });

    if (!bankAccount || !bankAccount?.stripeAccountId || !bankAccount?.externalAccountId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Payment Receive Back Account Information is missing!");
    }
 
      const stripeAccount = await stripe.accounts.retrieve(bankAccount?.stripeAccountId);

      if (!stripeAccount) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Payment Receive Back Account Not Found.");
      } 

      if (!stripeAccount.capabilities?.transfers || stripeAccount.capabilities.transfers !== "active") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Payment Receive Back Account Unverified");
      }

      const externalAccount = stripeAccount.external_accounts.data.find(
        (account) => account.id === bankAccount.externalAccountId
      );

      if (!externalAccount) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Payment Receive Back Account Not Found.");
      } 

      console.log("price====", currency, price)
 
    const unitAmount =  Number(price) * 100;
 
    let session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${DOMAIN_URL}/payment/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${DOMAIN_URL}/cancel`,
      customer_email: `${user?.email}`,
      client_reference_id: serviceId,
      metadata: {
        payUser: userId,
        payUserType: payUserRole,
        receiveUser: receiveUser.toHexString(),
        receiveUserType: receiveUserRole,
        serviceId: serviceId,
        stripeAccountId: bankAccount?.stripeAccountId,
        partnerId: partnerId,
        winBid: bidDetails.price,
      },
      line_items: [
        {
          price_data: {
            currency: currency,
            unit_amount: Number(parseFloat(unitAmount).toFixed(2)),
            product_data: {
              name: service.service,
              description: service.description,
            },
          },
          quantity: 1,
        },
      ],
    });
 
    return { url: session.url };

  } catch (error) {
    throw new ApiError(400, error.message);
  }
};

const stripeCheckAndUpdateStatusSuccess = async (req, res) => {
  const sessionId = req.query.session_id; 

  if (!sessionId) {
    return { status: "failed", message: "Missing session ID in the request." };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return { status: "failed", message: "Session not found." };
    }

    if (session.payment_status !== 'paid') {
      return { status: "failed", message: "Payment not approved." };
    }

    const { receiveUser, payUser, payUserType, receiveUserType, serviceId, winBid, partnerId} = session.metadata;
    // const accepted = await ServicesService.conformPartner(serviceId, partnerId)
    const service = await Services.findById(serviceId);
    if (!service) {
      return {
        status: "failed",
        message: "Service not found!",
        text: 'Payment succeeded, but the service could not be found. Please contact support.'
      };
    }

    if (service.paymentStatus === 'paid') {
      const existingTransaction = await Transaction.findOne({ serviceId: service._id });
      return { status: "success", result: existingTransaction };
    }

    service.paymentStatus = 'paid';
    service.transactionId = session.payment_intent;
    service.paymentMethod = 'Stripe';
    await service.save();

    let amount = Number(session.amount_total) / 100; 

  
    let totalAmount = Number(amount);
    if (session.currency === 'mxn') {
      const { dollarCost } = await VariableCount.convertPesoToDollar(amount);
      totalAmount = dollarCost;
    }

    let receiverAmount = Number(winBid); 
    if (service.mainService === "sell") {
       const variable = await Variable.findOne();
       const surcharge = Number(variable?.surcharge || 0);
      receiverAmount = Number(winBid) - (Number(winBid) * surcharge) / 100;   
    } 

       await Services.findByIdAndUpdate(
        serviceId,
        {
          confirmedPartner: partnerId,
          status: ENUM_SERVICE_STATUS.ACCEPTED,
          winBid: winBid,
        },
        { new: true }
      );

       const bulkOps = [
       {
         updateMany: {
           filter: { service: serviceId },
           update: { $set: { status: "Outbid" } },
         },
       },
       {
         updateOne: {
           filter: { service: serviceId, partner: partnerId },
           update: { $set: { status: "Win" } },
         },
       },
     ]; 
     await Bids.bulkWrite(bulkOps);
 
    const transactionData = {
      serviceId,
      payUser,
      payUserType,
      receiveUser,
      receiveUserType,
      paymentMethod: 'Stripe',
      amount: totalAmount,  
      partnerAmount: receiverAmount,  
      paymentStatus: "Completed",
      isFinish: false,
      payType: service.mainService,
      transactionId: session.payment_intent,
      paymentDetails: {
        email: session.customer_email,
        payId: sessionId,
        currency: "USD", 
      }
    };

    const newTransaction = await Transaction.create(transactionData); 

    await NotificationService.sendNotification({
      title: {
        eng: "You’ve Won the Bid!",
        span: "¡Has Ganado la Oferta!"
      },
      message: {
        eng: "Congratulations! Your bid for service has been accepted.",
        span: "¡Felicidades! Tu oferta por el servicio ha sido aceptada."
      },
      user: partnerId,
      userType: 'Partner',
      types: 'service',
      getId: serviceId,
    });

    return { status: "success", result: newTransaction };

  } catch (error) {
    console.error('Error processing Stripe payment:', error);
    return { status: "failed", message: "Payment execution failed", error: error.message };
  }
};

const paymentStatusCancel = async (req, res) => {
  return { status: "canceled" }
}

//Stripe Refund Payment =================
const stripeRefundPayment = async (req, res) => {
  const { saleId, amount, serviceId } = req.body;
  const { userId, emailAuth, role } = req.user;

  try {
    if (!saleId || !amount || !serviceId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Missing required parameters!");
    }
    const service = await Services.findById(serviceId);
    if (!service) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Service not found!");
    }

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

    const refund = await stripe.refunds.create({
      payment_intent: saleId,
      amount: Math.round(amount * 100),
      // currency: 'usd',
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

    // log=====
    const newTask = {
      admin: userId,
      email: emailAuth,
      description: `Refund successful: Service ID ${serviceId} refunded an amount of $${amount} via Stripe.`,
      types: "Refund",
      activity: "task",
      status: "Success",
    };
    await LogsDashboardService.createTaskDB(newTask)
    //=====

    return { success: true, transaction: newTransaction };

  } catch (error) {
    // Log =====
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
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to process refund.");
  }
};
// =====================
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
    if (account.id && account.external_accounts.data.length) {
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

    return await stripe.tokens.create({
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

const saveStripeAccount = async (account, user, userid, userType, address, dob, businessProfile, bank_info) => {

  const newStripeAccount = StripeAccount({
    name: user?.name || "Unknown",
    email: user?.email,
    user: userid,
    userType: userType,
    stripeAccountId: account.id,
    externalAccountId: account.external_accounts?.data[0].id,
    address: {
      line1: address.line1,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      phone_number: address?.phone_number,
      personal_rfc: address?.personal_rfc,
    },
    bank_info: {
      account_holder_name: bank_info.account_holder_name,
      account_holder_type: bank_info.account_holder_type,
      account_number: bank_info.account_number,
      routing_number: bank_info.routing_number,
      country: bank_info.country,
      currency: bank_info.currency,
    },
    business_profile: {
      business_name: businessProfile?.business_name || user.name || "Unknown",
      website: businessProfile?.website || "www.example.com",
      product_description: businessProfile?.product_description,
    },
    dateOfBirth: new Date(dob),
  });
  const saveData = await newStripeAccount.save();

  return saveData
};

// =================== 
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

    const accountId = stripeAccount.stripeAccountId;

    const accountToken = await stripe.tokens.create({
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
      const activeBankAccount = account.external_accounts.data.find(
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
      message: "User data updated successfully.",
      updatedStripeAccount,
    };
  } catch (error) {
    console.error("Error updating user data:", error);
    throw new ApiError(error.statusCode || 500, error.message || "Internal Server Error");
  }
};

const TransferBalance = async ({ bankAccount, amount }) => {
  // try {
  //   if (!bankAccount || !bankAccount.stripeAccountId || !bankAccount.externalAccountId) {
  //     throw new ApiError(400, "Invalid bank account data provided!");
  //   }

  //   if (!amount || isNaN(amount) || amount <= 0) {
  //     throw new ApiError(400, "Invalid transfer amount!");
  //   }
  //   const amountInCent = amount * 100;

  //   const transfer = await stripe.transfers.create({
  //     amount: amountInCent,
  //     currency: 'mxn',
  //     destination: bankAccount.stripeAccountId,
  //   });

  //   // const balance = await stripe.balance.retrieve({
  //   //   stripeAccount: bankAccount.stripeAccountId,  
  //   // });

  //   // Payout to bank
  //   const payout = await stripe.payouts.create(
  //     {
  //       amount: amountInCent,
  //       currency: 'mxn',
  //     },
  //     {
  //       stripeAccount: bankAccount.stripeAccountId,
  //     },
  //   );

  //   if (!payout) {
  //     throw new ApiError(500, "Failed to complete the payout.");
  //   }

  //   return payout;

  // } catch (error) {
  //   if (error.code === 'balance_insufficient') {
  //     throw new ApiError(400, "Insufficient funds in Stripe balance. Please wait for payments are available.");
  //   }
  //   console.error("Payout Error:", error);
  //   throw new ApiError(500, "Internal server error: " + error.message);
  // }
};




//Bank Transfer Payment ------------
const PaymentService = {
  createConnectedAccountWithBank,
  createCheckoutSessionStripe,
  paymentStatusCancel,
  stripeCheckAndUpdateStatusSuccess,
  stripeRefundPayment,
  TransferBalance,
  updateUserDataOfBank
}

module.exports = PaymentService;

