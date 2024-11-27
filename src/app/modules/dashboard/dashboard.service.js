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
const { Transaction } = require("../payment/payment.model");
const Notification = require("../notification/notification.model");


const getYearRange = (year) => {
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year}-12-31`);
  return { startDate, endDate };
};

// =User Partner Admin Management ========================
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
//=Auction Management ========================
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
//=Overview ========================
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
    page,
    limit
  } = req.query;

  const categories = req.body.categories || [];  

  const filterQuery = {}; 
    if (service) {
      filterQuery.service = { $regex: service, $options: "i" };
    }
    if (categories.length > 0) {
      filterQuery.category = { $in: categories };
    } 

    filterQuery.page = page
    filterQuery.limit = limit

  const result = new QueryBuilder(Services.find({}), filterQuery)
  .search(["service"])
  .filter()
  .sort()
  .paginate()
  .fields();
 
  const services  = await result.modelQuery;
  const meta = await result.countTotal();
  
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
 
  return {sortedServices,meta};
};
//=Total Income/User/Auction ========================
const getTotalIncomeUserAuction = async (req, res) => {
 
      const resultIncome = await Transaction.aggregate([
          {
              $match: {
                  paymentStatus: "Completed",  
              },
          },
          {
              $group: {
                  _id: null, 
                  totalIncome: { $sum: "$amount" },  
              },
          },
      ]);

      const usersResult = await User.find({})
      const servicesResult = await Services.find({})

      // Check if resultIncome is empty
      const income = resultIncome.length > 0 ? resultIncome[0].totalIncome : 0;
      const users = usersResult.length ? usersResult.length : 0;
      const services = servicesResult.length ? servicesResult.length : 0;

      return { income, users, services };
 
};

//=Overview ==========================  
const incomeOverview = async (year) => {
  try {
    const currentYear = new Date().getFullYear();
    const selectedYear = year || currentYear; 
    const startDate = new Date(`${selectedYear}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${selectedYear + 1}-01-01T00:00:00.000Z`);

    const incomeOverview = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          paymentStatus: "Completed", 
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } }, 
          totalIncome: { $sum: "$amount" }, 
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          totalIncome: 1,
        },
      },
      {
        $sort: { month: 1 }, 
      },
    ]);
    
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const result = Array.from({ length: 12 }, (_, i) => {
      const monthData = incomeOverview.find((data) => data.month === i + 1) || {
        month: i + 1,
        totalIncome: 0,
      };
      return {
        month: months[i],
        totalIncome: monthData.totalIncome,
      };
    });

    console.log(result);

    return {
      year: selectedYear,
      data: result,
    };
  } catch (error) {
    console.error("Error in getIncomeOverviewByYear function:", error);
 
    throw new ApiError(httpStatus.BAD_REQUEST, "Service not found:", error.message);
  }
}; 

const getUserGrowth = async (year) => {
  try {
    const currentYear = new Date().getFullYear();
    const selectedYear = year || currentYear;

    const { startDate, endDate } = getYearRange(selectedYear);

    const monthlyUserGrowth = await Auth.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
          role: { $in: ['USER', 'PARTNER'] }, 
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          year: '$_id.year',
          count: 1,
        },
      },
      {
        $sort: { month: 1 },
      },
    ]);

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const result = [];
    for (let i = 1; i <= 12; i++) {
      const monthData =
        monthlyUserGrowth.find((data) => data.month === i) || {
          month: i,
          count: 0,
          year: selectedYear,
        };
      result.push({
        ...monthData,
        month: months[i - 1],
      });
    }

    return {
      year: selectedYear,
      data: result,
    };
  } catch (error) {
    console.error('Error in getUserGrowth function: ', error);  
    throw new ApiError(httpStatus.BAD_REQUEST, "Service not found:", error.message);
  }
};
// -----------------------------------------
const sendNoticeUsers = async (req, res) => {
  const { userId, all_user } = req.query;
  const { title, message } = req.body;

  if (!title || !message) { 
    throw new ApiError(400, 'Title and message are required.');
  } 
  try { 
    if (all_user) {
      const users = await User.find({});
       
      const notifications = users.map(user =>
        Notification.create({
          title,
          userId: user._id,
          message,
          admin_ms: true,
        })
      ); 
      await Promise.all(notifications);
    } else { 
      if (!userId) { 
        throw new ApiError(404,'User ID is required.');
      }

      await Notification.create({
        title,
        userId,
        message,
        admin_ms: true,
      });
    }

    return  { massage: "Notification(s) sent successfully." };
  } catch (error) {
    console.error("Error sending notifications:", error);
    throw new ApiError(500,"An error occurred while sending notifications." );
  }
};

const sendNoticePartner = async (req, res) => {
  const { userId, all_user } = req.query;
  const { title, message } = req.body;

  console.log(title, message)

  if (!title || !message) { 
    throw new ApiError(400, 'Title and message are required.');
  } 
 
    if (all_user) {
      // console.log('title, message', all_user)
      const users = await Partner.find({});
      const notifications = users.map(user =>
        Notification.create({
          title,
          userId: user._id,
          message,
          admin_ms: true,
        })
      ); 
      await Promise.all(notifications);
    } else { 

      if (!userId) { 
        throw new ApiError(404,'User ID is required.');
      }

      await Notification.create({
        title,
        userId,
        message,
        admin_ms: true,
      });
    }

  return  { massage: "Notification(s) sent successfully." };
   
};
// -----------------------
const getTransactionsHistory = async (req) => {
  const query = req.query; 
  try {  
    const servicesQuery = new QueryBuilder(Transaction.find(), query) 
    .search(["userId.name", "partnerId.name"])
    .filter()
    .sort()
    .paginate()
    .fields();
    
    servicesQuery.modelQuery
    .populate("userId", "name email profile_image") 
    .populate("partnerId", "name email profile_image") 
    .populate("serviceId", "service category price");  

  const result = await servicesQuery.modelQuery;
  console.log("data", result)
  const meta = await servicesQuery.countTotal();

    return {result, meta};
  } catch (error) {
    console.error("Error fetching transactions history:", error);
    throw new ApiError(500, "Internal Server Error");
  }
}

const getTransactionsDetails = async (req) => {
  const { id } = req.params;

  try { 
    if (!id) {
      throw new ApiError(400, "Transaction ID is required.");
    }
 
    const result = await Transaction.findById(id)
      .populate("userId")  
      .populate("partnerId") 
      .populate("serviceId"); 

    if (!result) {
      throw new ApiError(404, "Transaction not found.");
    }

    return result;
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    throw new ApiError(500, "Internal Server Error");
  }
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
  filterAndSortServices,
  getTotalIncomeUserAuction,
  incomeOverview,
  getUserGrowth,
  sendNoticeUsers,
  sendNoticePartner,
  getTransactionsHistory,
  getTransactionsDetails
};

module.exports = { DashboardService };
