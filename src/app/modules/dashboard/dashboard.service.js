const httpStatus = require("http-status");

const Auth = require("../auth/auth.model");
const User = require("../user/user.model");
const QueryBuilder = require("../../../builder/queryBuilder");
const ApiError = require("../../../errors/ApiError");
const Partner = require("../partner/partner.model");
const Admin = require("../admin/admin.model");
const { TermsConditions, PrivacyPolicy } = require("../manage/manage.model");
const { ENUM_PARTNER_AC_STATUS } = require("../../../utils/enums");
const { sendEmail } = require("../../../utils/sendEmail");
const approvedBody = require("../../../mails/approvedBody");
const { resetEmailTemplate } = require("../../../mails/reset.email");
const disapprovedBody = require("../../../mails/disapprovedBody");
const Services = require("../services/services.model");
const Variable = require("../variable/variable.model");

// User Partner Admin Management ========================

const getAllUsers = async (query) => {
  const userQuery = new QueryBuilder(User.find().populate("authId"), query)
    .search(["name", "email"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await userQuery.modelQuery;
  const meta = await userQuery.countTotal();

  return {
    meta,
    data: result,
  };
};

const getUserDetails = async (query) => {
  const { id } = query;

  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing User Id");
  }

  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return user;
};

const deleteUser = async (query) => {
  const { email } = query || {};

  if (!email) {
    throw new ApiError(404, "Missing email");
  }

  const isUserExist = await Auth.isAuthExist(email);

  if (!isUserExist) {
    throw new ApiError(404, "User does not exist");
  }

  await User.deleteOne({ authId: isUserExist._id });
  return await Auth.deleteOne({ email });
};

const blockUnblockUserPartnerAdmin = async (payload) => {
  const { role, email, is_block } = payload;

  const updatedAuth = await Auth.findOneAndUpdate(
    { email: email, role: role },
    { $set: { is_block } },
    {
      new: true,
      runValidators: true,
    }
  ).select("role name email is_block");

  if (!updatedAuth) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return updatedAuth;
};

const getAllPartner = async (query) => {
  const partnerQuery = new QueryBuilder(
    Partner.find().populate("authId"),
    query
  )
    .search(["name", "email"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await partnerQuery.modelQuery;
  const meta = await partnerQuery.countTotal();

  if (!result?.length) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partner not found");
  }

  return {
    meta,
    data: result,
  };
};

const getPartnerDetails = async (query) => {
  const { email } = query;

  if (!email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing email");
  }

  const partner = await Partner.findOne({ email: email }).populate("authId");

  if (!partner) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partner not found");
  }

  return partner;
};

const deletePartner = async (query) => {
  const { email } = query;
  if (!email) {
    throw new ApiError(404, "Missing email");
  }

  const isUserExist = await Auth.isAuthExist(email);
  if (!isUserExist) {
    throw new ApiError(404, "Partner does not exist");
  }

  const [result, ,] = await Promise.all([
    Auth.deleteOne({ _id: isUserExist._id }),
    Partner.deleteOne({ authId: isUserExist._id }),
  ]);

  return result;
};

const getAllAdmins = async (query) => {
  const adminQuery = new QueryBuilder(Admin.find({}).populate("authId"), query)
    .search(["name", "email"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await adminQuery.modelQuery;
  const meta = await adminQuery.countTotal();

  if (!result?.length) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partner not found");
  }

  return {
    meta,
    data: result,
  };
};

const getAdminDetails = async (query) => {
  const { email } = query;

  if (!email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing email");
  }

  const admin = await Admin.findOne({ email: email }).populate("authId");

  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, "Admin not found");
  }

  return admin;
};

const deleteAdmin = async (query) => {
  const { email } = query;
  const isAdminExist = await Auth.isAuthExist(email);

  if (!isAdminExist) {
    throw new ApiError(404, "Admin does not exist");
  }
  const [result, ,] = await Promise.all([
    Auth.deleteOne({ _id: isUserExist._id }),
    Admin.deleteOne({ authId: isUserExist._id }),
  ]);

  return result;
};

const getAllPendingPartners = async (query) => {
  const userQuery = new QueryBuilder(
    Partner.find({ status: { $eq: ENUM_PARTNER_AC_STATUS.PENDING } }).populate(
      "authId"
    ),
    query
  )
    .search(["name", "email"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await userQuery.modelQuery;
  const meta = await userQuery.countTotal();

  if (!result.length) {
    throw new ApiError(httpStatus.NOT_FOUND, "No pending partner requests");
  }

  return {
    meta,
    data: result,
  };
};

const approveDeclinePartner = async (payload) => {
  const { partnerEmail, status } = payload;

  if (!partnerEmail || !status) {
    throw new ApiError(400, "Partner email and status is required");
  }

  const [existPartner, existAuth] = await Promise.all([
    Partner.findOne({ email: partnerEmail }),
    Auth.findOne({ email: partnerEmail }),
  ]);

  if (!existPartner || !existAuth) {
    throw new ApiError(400, "Partner not found");
  }

  const active = await Partner.findOneAndUpdate(
    { email: partnerEmail },
    { status: status },
    {
      new: true,
      runValidators: true,
    }
  ).select("email status");

  const data = {
    name: existPartner.name,
  };

  try {
    sendEmail({
      email: partnerEmail,
      subject:
        status === ENUM_PARTNER_AC_STATUS.APPROVED
          ? "Partner Profile Approved"
          : "Partner Profile Declined",
      html:
        status === ENUM_PARTNER_AC_STATUS.APPROVED
          ? approvedBody(data)
          : disapprovedBody(data),
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }

  return active;
}; 

const addTermsConditions = async (payload) => {
  const checkIsExist = await TermsConditions.findOne();

  if (checkIsExist) {
    const result = await TermsConditions.findOneAndUpdate({}, payload, {
      new: true,
      runValidators: true,
    });

    return {
      message: "Terms & conditions updated",
      result,
    };
  } else {
    return await TermsConditions.create(payload);
  }
};

const getTermsConditions = async () => {
  return await TermsConditions.findOne();
};

const deleteTermsConditions = async (query) => {
  const { id } = query;

  const result = await TermsConditions.findByIdAndDelete(id);

  if (!result) {
    throw new ApiError(404, "TermsConditions not found");
  }

  return result;
};

const addPrivacyPolicy = async (payload) => {
  const checkIsExist = await PrivacyPolicy.findOne();

  if (checkIsExist) {
    const result = await PrivacyPolicy.findOneAndUpdate({}, payload, {
      new: true,
      runValidators: true,
    });

    return {
      message: "Privacy policy updated",
      result,
    };
  } else {
    return await PrivacyPolicy.create(payload);
  }
};

const getPrivacyPolicy = async () => {
  return await PrivacyPolicy.findOne();
};

const deletePrivacyPolicy = async (query) => {
  const { id } = query;

  const result = await PrivacyPolicy.findByIdAndDelete(id);

  if (!result) {
    throw new ApiError(404, "Privacy Policy not found");
  }

  return result;
};

// Auction Management ========================

const getAllAuctions = async (query) => {
  const servicesQuery = new QueryBuilder(Services.find({}), query)
    .search([])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await servicesQuery.modelQuery;
  const meta = await servicesQuery.countTotal();

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service not found");
  }

  return {
    meta,
    data: result,
  };
  // const { serviceType, page = 1, limit = 10 } = query;
  // const skip = (page - 1) * limit;

  // if (!serviceType) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, "Missing service type");
  // }

  // let type;
  // if (serviceType === "sell") {
  //   type = ["Second-hand items", "Recyclable materials"];
  // } else {
  //   type = ["Goods", "Waste"];
  // }

  // const [totalServices, result] = await Promise.all([
  //   Services.countDocuments({ service: { $in: type } }),
  //   Services.find({ service: { $in: type } })
  //     .skip(skip)
  //     .limit(Number(limit)),
  // ]);

  // if (!result?.length) {
  //   throw new ApiError(httpStatus.NOT_FOUND, "Services not found");
  // }

  // const totalPage = Math.ceil(totalServices / limit);

  // return {
  //   meta: {
  //     page: Number(page),
  //     limit: Number(limit),
  //     total: totalServices,
  //     totalPage,
  //   },
  //   data: result,
  // };
};

const editMinMaxBidAmount = async (payload) => {
  const { serviceId, minPrice: min, maxPrice: max } = payload;

  if (Number(max) < Number(min)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "maxPrice can not be less than minPrice"
    );
  }

  const result = await Services.findByIdAndUpdate(
    serviceId,
    {
      $set: {
        minPrice: Number(min),
        maxPrice: Number(max),
      },
    },
    { new: true, runValidators: true }
  ).select({ minPrice: 1, maxPrice: 1 });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service not found");
  }

  return result;
};

// overview ========================

const calculateYearlyRevenue = async (query) => {
  const { year: strYear } = query;
  const year = Number(strYear);

  if (!year) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing year");
  }

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);

  const distinctYears = await Transaction.aggregate([
    {
      $group: {
        _id: { $year: "$createdAt" },
      },
    },
    {
      $sort: { _id: -1 },
    },
    {
      $project: {
        year: "$_id",
        _id: 0,
      },
    },
  ]);

  const totalYears = distinctYears.map((item) => item.year);

  const revenue = await Subscription.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
        // paymentStatus: "succeeded", // Only include successful payments
      },
    },
    {
      $project: {
        price: 1, // Only keep the price field
        month: { $month: "$createdAt" }, // Extract the month from createdAt
      },
    },
    {
      $group: {
        _id: "$month", // Group by the month
        totalRevenue: { $sum: "$price" }, // Sum up the price for each month
      },
    },
    {
      $sort: { _id: 1 }, // Sort the result by month (ascending)
    },
  ]);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthlyRevenue = monthNames.reduce((acc, month) => {
    acc[month] = 0;
    return acc;
  }, {});

  revenue.forEach((r) => {
    const monthName = monthNames[r._id - 1];
    monthlyRevenue[monthName] = r.totalRevenue;
  });

  return {
    total_years: totalYears,
    monthlyRevenue,
  };
};

const getMonthlyRegistrations = async (query) => {
  const year = Number(query.year);
  const startOfYear = new Date(year, 0, 1); // January 1st of the year
  const endOfYear = new Date(year + 1, 0, 1); // January 1st of the next year

  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString("en", { month: "long" })
  );

  // Aggregate monthly registration counts and list of all years
  const [monthlyRegistration, totalYears] = await Promise.all([
    Auth.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfYear,
            $lt: endOfYear,
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          month: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]),
    Auth.aggregate([
      {
        $group: {
          _id: { $year: "$createdAt" },
        },
      },
      {
        $project: {
          year: "$_id",
          _id: 0,
        },
      },
      {
        $sort: {
          year: 1,
        },
      },
    ]).then((years) => years.map((y) => y.year)),
  ]);

  // Initialize result object with all months set to 0
  const result = months.reduce((acc, month) => ({ ...acc, [month]: 0 }), {});

  // Populate result with actual registration counts
  monthlyRegistration.forEach(({ month, count }) => {
    result[months[month - 1]] = count;
  });

  return {
    total_years: totalYears,
    monthlyRegistration: result,
  };
};

const totalOverview = async () => {
  const [totalAuth, totalUser, totalPartner, totalAdmin, totalAuction] =
    await Promise.all([
      Auth.countDocuments(),
      User.countDocuments(),
      Partner.countDocuments(),
      Admin.countDocuments(),
      Services.countDocuments(),
    ]);

  return {
    totalAuth,
    totalUser,
    totalPartner,
    totalAdmin,
    totalAuction,
  };
};
 
const parseDateTime = (date, time) => {
  const [month, day, year] = date.split('/').map(Number);
  const [hours, minutes] = time.split(':').map((part, index) => {
    if (index === 0) {
      return parseInt(part, 10);  
    }
    return parseInt(part, 10); 
  });

  let adjustedHours = hours;
  if (time.includes("PM") && hours < 12) {
    adjustedHours += 12;   
  } else if (time.includes("AM") && hours === 12) {
    adjustedHours = 0;  
  }

  return new Date(year, month - 1, day, adjustedHours, minutes);
};
 
const filterAndSortServices = async (req, res) => {
  const {
    service,      
    sortBy ,
    sortOrder,
  } = req.query;

  const categories = req.body.categories || [];  
 
  const filterQuery = {};

  if (service) {
    filterQuery.service = { $regex: service, $options: "i" };  
  }

  if (categories.length > 0) {
    filterQuery.category = { $in: categories };  
  }
 
  const services = await Services.find(filterQuery);
 
  const getRelevantDate = (service) => {
    if (sortBy === 'deadline' && service.deadlineDate && service.deadlineTime) {
      return parseDateTime(service.deadlineDate, service.deadlineTime);
    } else if (sortBy === 'schedule' && service.scheduleDate && service.scheduleTime) {
      return parseDateTime(service.scheduleDate, service.scheduleTime);
    }
    return null;
  };
 
  const sortedServices = services.sort((a, b) => {
    const dateA = getRelevantDate(a);
    const dateB = getRelevantDate(b);

    if (!dateA || !dateB) return 0;  
 
    if (sortOrder === "endSoon") {
      return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
    }
 
    if (sortOrder === "laterFast") {
      return dateA > dateB ? -1 : dateA < dateB ? 1 : 0;
    }

    return 0;  
  });
 
  return sortedServices;
};



 

const DashboardService = {
  getAllUsers,
  getUserDetails,
  deleteUser,
  getAllPartner,
  getPartnerDetails,
  deletePartner,
  getAllPendingPartners,
  approveDeclinePartner,
  getAllAdmins,
  getAdminDetails,
  deleteAdmin,
  blockUnblockUserPartnerAdmin,
  addTermsConditions,
  getTermsConditions,
  deleteTermsConditions,
  addPrivacyPolicy,
  getPrivacyPolicy,
  deletePrivacyPolicy,
  getAllAuctions,
  editMinMaxBidAmount,
  totalOverview,
  getMonthlyRegistrations, 
  filterAndSortServices
};

module.exports = { DashboardService };
