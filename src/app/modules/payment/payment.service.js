const httpStatus = require("http-status");
const Partner = require("../partner/partner.model");
const User = require("../user/user.model");
const Services = require("../services/services.model");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const config = require("../../../config");
const ApiError = require("../../../errors/ApiError");
const { Transaction, StripeAccount } = require("./payment.model");
const stripe = require("stripe")(config.stripe.stripe_secret_key);
const { LogsDashboardService } = require("../logs-dashboard/logsdashboard.service");
const Admin = require("../admin/admin.model");

const DOMAIN_URL = process.env.RESET_PASS_UI_LINK;

//Stripe Payment =====================
const createCheckoutSessionStripe = async (req) => {
  try {
    const { serviceId } = req.body
    const { userId, role } = req.user

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
      throw new ApiError(httpStatus.NOT_FOUND, 'invalid service ID.');
    }
    const packagePrice = Number(service.winBid);
    if (!packagePrice) {
      throw new ApiError(httpStatus.NOT_FOUND, 'No conform the partner for service');
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

    const unitAmount = packagePrice * 100;

    console.log("===", userId, role)

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
      },
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

    return { url: session.url };

  } catch (error) {
    throw new ApiError(400, error);
  }
};

const stripeCheckAndUpdateStatusSuccess = async (req, res) => {
  const sessionId = req.query.session_id;

  console.log('stripeCheckAndUpdateStatusSuccess', sessionId)

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

    const { receiveUser, payUser, payUserType, receiveUserType, serviceId } = session.metadata;
    // console.log("=====",receiveUser, payUser, payUserType, receiveUserType, serviceId)

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
      console.log("Existing Transaction", existingTransaction);
      return { status: "success", result: existingTransaction };
    }

    service.paymentStatus = 'paid';
    service.transactionId = session.payment_intent;
    service.paymentMethod = 'Stripe',
      await service.save();

    // Create transaction data
    const transactionData = {
      serviceId,
      payUser,
      payUserType,
      receiveUser,
      receiveUserType,
      paymentMethod: 'Stripe',
      amount: Number(session.amount_total) / 100,
      paymentStatus: "Completed",
      isFinish: false,
      payType: service.mainService,
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

  console.log("fds", saleId, amount, serviceId)

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

const createConnectedAccountWithBank = async (req, res) => {
  try {
    const { userId, role } = req.user;
    console.log("===", userId, role) 

    console.log("ID:", userId);
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
      userType="User"
      existingUser = await User.findById(userId);
    } else if (role === "PARTNER") {
       userType="Partner"
      existingUser = await Partner.findById(userId);
    }
    if (!existingUser) throw new ApiError(httpStatus.NOT_FOUND, `${role} not found.`);

    // Handle KYC files and create token in parallel
    const [token] = await Promise.all([
      createStripeToken(existingUser, dob, address),
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
    !address.postal_code ||
    !address.phone_number ||
    !address.personal_rfc
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
 
  if (
    !business_profile ||
    !business_profile.business_name
  ) {
    throw new Error("All business profile fields are required: business_name.");
  }
  return null;
};

const createStripeToken = async (user, dob, address) => {
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
            country: address.country,
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

  try {
    return await stripe.accounts.create({
      type: "custom",
      account_token: token.id,
      capabilities: {
        transfers: { requested: true },
      },
      business_profile: {
        mcc: "5970",
        name: business_profile.business_name || user.name || "Unknown",
        url: business_profile.website || "www.example.com",
      },
      external_account: {
        object: "bank_account",
        account_holder_name: bank_info.account_holder_name,
        account_holder_type: bank_info.account_holder_type,
        account_number: bank_info.account_number,
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
      business_name: businessProfile.business_name,
      website: businessProfile?.website,
      product_description: businessProfile?.product_description,
    },
    dateOfBirth: new Date(dob),
  });
  const saveData = await newStripeAccount.save();
  
  return saveData
 
  
};


















const stripeTransferPayment = (req, res) => {
  // Implement Bank Transfer Payment logic here  
  return
}
const transferPayments = async (req, res) => {
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
//Bank Transfer Payment ------------
const PaymentService = {
  createConnectedAccountWithBank,
  createCheckoutSessionStripe,
  paymentStatusCancel,
  stripeCheckAndUpdateStatusSuccess,
  stripeRefundPayment,
  transferPayments,
  stripeTransferPayment
}

module.exports = PaymentService;

