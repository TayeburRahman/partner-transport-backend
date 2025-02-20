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
const auth = require("../../middlewares/auth");
const { NotificationService } = require("../notification/notification.service");
const VariableCount = require("../variable/variable.count");
const { LogsDashboardService } = require("../logs-dashboard/logsdashboard.service");

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

  const user = await User.findById(id).populate("authId");;

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return user;
};

const deleteUser = async (query) => {
  const { userId } = query || {};

  if (!userId) {
    throw new ApiError(404, "User ID is missing.");
  }
 
  const activeService = await Services.findOne({
    user: userId,
    status: { $in: ['accepted', 'rescheduled', 'pick-up', 'in-progress'] },
  });

  if (activeService) {
    throw new ApiError(400, "The user has active services associated with a partner.");
  }
 
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User does not exist.");
  }
 
  await User.deleteOne({ _id: userId });
  return await Auth.deleteOne({ _id: user.authId });
};

const blockUnblockUserPartnerAdmin = async (req) => {
  const { role, email, is_block } = req.body;
  const { emailAuth, userId } = req.user;
  try {
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
    // log=====
    const newTask = {
      admin: userId,
      email: emailAuth,
      description: `User with email ${email} and role ${role} was successfully ${is_block ? "blocked" : "unblocked"}.`,
      types: "Update",
      activity: "reglue",
      status: "Success",
    };
    await LogsDashboardService.createTaskDB(newTask)
    // =====

    return updatedAuth;

  } catch (error) {
    // log=====
    const newTask = {
      admin: userId,
      email: emailAuth,
      description: `An unexpected error ${is_block ? "block" : "unblock"} user with email ${email} and role ${role}: ${error.message}.`,
      types: "Failed",
      activity: "reglue",
      status: "Error",
    };
    await LogsDashboardService.createTaskDB(newTask)
    // =====
    throw new ApiError(httpStatus.NOT_FOUND, "An unexpected error" + " " + error.message);
  }
};

const getPaddingPartner = async (query) => {
  const aggregationPipeline = [
    {
      $match: {
        authId: { $ne: null },
      },
    },
    {
      $lookup: {
        from: "auths",
        localField: "authId",
        foreignField: "_id",
        as: "authId",
      },
    },
    {

      $match: {
        "authId.isActive": false,
      },
    },
    {
      $unwind: "$authId",
    },
    // { 
    // $project: {
    //   _id: 1,
    //   name: 1,
    //   email: 1,
    //   "authData._id": 1,
    //   "authData.name": 1,
    //   "authData.profile_image": 1,
    //   "authData.email": 1,
    // },
    // },
  ];

  const partners = await Partner.aggregate(aggregationPipeline);

  if (!partners.length) {
    throw new ApiError(httpStatus.NOT_FOUND, "No inactive partners found");
  }

  return {
    meta: { count: partners.length },
    data: partners,
  };
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
  const { id } = query;

  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing Id");
  }

  const partner = await Partner.findById(id).populate("authId");

  if (!partner) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partner not found");
  }

  return partner;
};

const deletePartner = async (query) => {
  const { userId } = query || {};

  if (!userId) {
    throw new ApiError(404, "Missing userId");
  }
 
  const activeService = await Services.findOne({
    confirmedPartner: userId,
    status: { $in: ['accepted', 'rescheduled', 'pick-up', 'in-progress'] },
  });

  if (activeService) {
    throw new ApiError(400, "The partner has active services associated with users.");
  }
 
  const partner = await Partner.findById(userId);
  if (!partner) {
    throw new ApiError(404, "Partner does not exist.");
  }
 
  await Partner.deleteOne({ _id: userId });
  return await Auth.deleteOne({ _id: partner.authId });
};

const getAllAdmins = async (query) => {
  const adminQuery = new QueryBuilder(Admin.find().populate("authId"), query)
    .search(["name", "email"])
    .filter()
    .sort()
    .paginate()
    .fields();
  const result = await adminQuery.modelQuery;

  if (!result?.length) {
    throw new ApiError(httpStatus.NOT_FOUND, "Admin not found");
  }

  const meta = await adminQuery.countTotal();

  return {
    meta,
    data: result,
  };
};

const getAdminDetails = async (query) => {
  const { id } = query;

  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing ID");
  }

  const admin = await Admin.findOne({ _id: id }).populate("authId");

  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, "Admin not found");
  }

  return admin;
};

const deleteAdmin = async (query) => {
  const { email } = query;

  const isAdminExist = await Auth.isAuthExist(email);
  if (!isAdminExist) {
    throw new ApiError(404, "Admin authentication does not exist.");
  }

  const admin = await Admin.findOne({ email });
  if (!admin) {
    throw new ApiError(404, "Admin record does not exist.");
  }

  const [authResult, adminResult] = await Promise.all([
    Auth.deleteOne({ _id: isAdminExist._id }),
    Admin.deleteOne({ _id: admin._id }),
  ]);

  return {
    success: true,
    message: "Admin deleted successfully.",
    authDeletion: authResult,
    adminDeletion: adminResult,
  };
};

const updateProfile = async (req) => {
  const { userId, authId } = req.query;
  const data = req.body;

  if(!userId || !authId) {
    throw new ApiError(400, "Missing userId and authId in the request!");
  }

  if (!data) {
    throw new ApiError(400, "Data is missing in the request body!");
  }

  const checkUser = await Admin.findById(userId);
  if (!checkUser) {
    throw new ApiError(404, "User not found!");
  }

  const checkAuth = await Auth.findById(authId);
  if (!checkAuth) {
    throw new ApiError(403, "You are not authorized");
  }
 
  if (data.name) {
    await Auth.findOneAndUpdate(
      { _id: authId },
      { name: data.name },
      { new: true }
    );
  }
 
  const updateUser = await Admin.findOneAndUpdate({ authId }, data, {
    new: true,
  }).populate("authId");

  return updateUser;
};

const getAllPendingPartners = async (query) => {
  const userQuery = new QueryBuilder(
    Partner.find({ status: { $eq: ENUM_PARTNER_AC_STATUS.PENDING } }).populate("authId"),
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

const approveDeclinePartner = async (req) => {
  const { partnerEmail, status } = req.body;
  const { userId, emailAuth } = req.user;

  if (!partnerEmail || !status) {
    throw new ApiError(400, "Partner email and status are required.");
  }

  try {
    const [existPartner, existAuth] = await Promise.all([
      Partner.findOne({ email: partnerEmail }),
      Auth.findOne({ email: partnerEmail }),
    ]);

    if (!existPartner || !existAuth) {
      throw new ApiError(404, "Partner not found.");
    }

    const active = await Partner.findOneAndUpdate(
      { email: partnerEmail },
      { status: status },
      {
        new: true,
        runValidators: true,
      }
    ).select("email status");

    await Auth.findOneAndUpdate(
      { email: partnerEmail },
      { isActive: status === "approved" ? true : false },
      {
        new: true,
        runValidators: true,
      }
    ).select("email isActive");

    const data = {
      name: existPartner.name,
    };

    try {
      // Send notification email to the partner
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
    } catch (emailError) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, emailError.message);
    }

    // Log success
    const newTask = {
      admin: userId,
      email: emailAuth,
      description: `Partner with email ${partnerEmail} has been ${status} by ${emailAuth}.`,
      types: "Update",
      activity: "task",
      status: "Success",
    };
    await LogsDashboardService.createTaskDB(newTask);

    return active;
  } catch (error) {
    // Log failure
    const newTask = {
      admin: userId,
      email: emailAuth,
      description: `Failed to update partner status for ${partnerEmail} by ${emailAuth}: ${error.message || "Unknown error"}.`,
      types: "Failed",
      activity: "task",
      status: "Error",
    };
    await LogsDashboardService.createTaskDB(newTask);

    throw new ApiError(
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "An error occurred while updating the partner's status."
    );
  }
};

const addTermsConditions = async (req) => {
  const { userId, emailAuth } = req.user;
  const payload = req.body

  try {
    const checkIsExist = await TermsConditions.findOne();

    let result;
    let message;

    if (checkIsExist) {
      result = await TermsConditions.findOneAndUpdate({}, payload, {
        new: true,
        runValidators: true,
      });
      message = "Terms & conditions updated successfully";
    } else {
      result = await TermsConditions.create(payload);
      message = "Terms & conditions added successfully";
    }

    // Log success
    const newTask = {
      admin: userId,
      email: emailAuth,
      description: `${message} by ${emailAuth}.`,
      types: checkIsExist ? "Update" : "Create",
      activity: "reglue",
      status: "Success",
    };
    await LogsDashboardService.createTaskDB(newTask);

    return {
      message,
      result,
    };
  } catch (error) {
    // Log failure
    const newTask = {
      admin: userId,
      email: emailAuth,
      description: `Failed to update or add terms & conditions by ${emailAuth}: ${error.message || "Unknown error"}.`,
      types: "Failed",
      activity: "reglue",
      status: "Error",
    };
    await LogsDashboardService.createTaskDB(newTask);

    throw new ApiError(
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "An error occurred while updating or adding terms & conditions."
    );
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

const addPrivacyPolicy = async (req) => {
  const { userId, emailAuth } = req.user;
  const payload = req.body;

  if (!payload || Object.keys(payload).length === 0) {
    throw new ApiError(400, "Payload is required to add or update privacy policy.");
  }

  try {
    const checkIsExist = await PrivacyPolicy.findOne();

    let result;
    let message;

    if (checkIsExist) {
      result = await PrivacyPolicy.findOneAndUpdate({}, payload, {
        new: true,
        runValidators: true,
      });
      message = "Privacy policy updated successfully";
    } else {
      result = await PrivacyPolicy.create(payload);
      message = "Privacy policy added successfully";
    }

    // Log success
    const newTask = {
      admin: userId,
      email: emailAuth,
      description: `${message} by ${emailAuth}.`,
      types: checkIsExist ? "Update" : "Create",
      activity: "reglue",
      status: "Success",
    };
    await LogsDashboardService.createTaskDB(newTask);

    return {
      message,
      result,
    };
  } catch (error) {
    // Log failure
    const newTask = {
      admin: userId,
      email: emailAuth,
      description: `Failed to update or add privacy policy by ${emailAuth}: ${error.message || "Unknown error"}.`,
      types: "Failed",
      activity: "reglue",
      status: "Error",
    };
    await LogsDashboardService.createTaskDB(newTask);

    throw new ApiError(
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "An error occurred while updating or adding the privacy policy."
    );
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
  const page = Number.isInteger(parseInt(query.page)) ? parseInt(query.page) : 1;
  const limit = Number.isInteger(parseInt(query.limit)) ? parseInt(query.limit) : 10;

  const matchQuery = {
    ...query.searchTerm
      ? {
        $or: [
          { "user.name": { $regex: query.searchTerm, $options: "i" } },
          { "confirmedPartner.name": { $regex: query.searchTerm, $options: "i" } },
        ],
      }
      : {},
    ...(query.mainService ? { mainService: query.mainService } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.service ? { service: query.service } : {}),
    ...(query.category ? { category: { $in: query.category.split(',') } } : {}),
  };

  const pipeline = [
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $lookup: {
        from: "partners",
        localField: "confirmedPartner",
        foreignField: "_id",
        as: "confirmedPartner",
      },
    },
    {
      $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
    },
    {
      $unwind: { path: "$confirmedPartner", preserveNullAndEmptyArrays: true },
    },
    {
      $match: matchQuery,
    },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: { path: "$category" },
    },
    {
      $facet: {
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        meta: [{ $count: "total" }],
      },
    },
  ];

  const [result] = await Services.aggregate(pipeline).sort({ _id: -1 } )
  
  ;

  return {
    meta: result.meta[0] || { total: 0 },
    data: result.data.reverse(),
  };
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
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year + 1, 0, 1);

  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString("en", { month: "long" })
  );

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
    sortBy,
    sortOrder,
    page,
    serviceStatus,
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
  if (serviceStatus) {
    filterQuery.status = { $in: serviceStatus };
  }

  filterQuery.page = page
  filterQuery.limit = limit

  const result = new QueryBuilder(
    Services.find({})
      .populate({
        path: "category",
        select: "_id category"
      })
    , filterQuery)
    .search(["service"])
    .filter()
    .sort()
    .paginate()
    .fields();


  const services = await result.modelQuery;
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
  const pisoVariable = await VariableCount.getPisoVariable();

  return { sortedServices, meta, piso: pisoVariable };
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
  const partnerResult = await Partner.find({})
  const servicesResult = await Services.find({})

  // Check if resultIncome is empty
  const income = resultIncome.length > 0 ? resultIncome[0].totalIncome : 0;
  const users = usersResult.length ? usersResult.length : 0;
  const services = servicesResult.length ? servicesResult.length : 0;
  const partner = partnerResult.length ? partnerResult.length : 0;



  return { income, users, services, partner };

};

//=Overview ==========================  
const incomeOverview = async ({year}) => {
  try {
    const currentYear = new Date().getFullYear();
    const selectedYear = parseInt(year, 10) || currentYear;

    if (isNaN(selectedYear)) {
      throw new ApiError(400, "Invalid year provided.");
    }

    const startDate = new Date(selectedYear, 0, 1);  
    const endDate = new Date(selectedYear + 1, 0, 1);  

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

    return {
      year: selectedYear,
      data: result,
    };
  } catch (error) {
    console.error("Error in getIncomeOverviewByYear function:", error);

    throw new ApiError(httpStatus.BAD_REQUEST, "Service not found:", error.message);
  }
};

const getUserGrowth = async ({year}) => {
  try {
    const currentYear = new Date().getFullYear();
    const selectedYear = parseInt(year, 10) || currentYear;

    if (isNaN(selectedYear)) {
      throw new ApiError(400, "Invalid year provided.");
    }

    const startDate = new Date(selectedYear, 0, 1);  
    const endDate = new Date(selectedYear + 1, 0, 1);     
    const monthlyUserGrowth = await Auth.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          role: { $in: ['USER', 'PARTNER'] },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
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
        }; 
      result.push({
        month: months[i - 1],
        count: monthData.count,
      });
    }

    return {
      year: selectedYear,
      data: result,
    };
  } catch (error) {
    console.error('Error in getUserGrowth function:', error);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Service not found: ${error.message}`
    );
  }
};

// =Send Notice=====================
const sendNoticeUsers = async (req, res) => {
  const { userId, all_user } = req.query;
  const { title, message } = req.body;
  const { userId: admin, emailAuth } = req.user;

  if (!title || !message) {
    throw new ApiError(400, 'Title and message are required.');
  }
  try {
    if (all_user) {
      const users = await User.find({});

      const notifications = users.map(user => ({
        title: {
          eng: "Important Notice from Administrator",
          span: "Aviso Importante del Administrador"
        },
        user: user._id,
        admin_ms: true,
        userType: "User",
        message: {
          eng: "We have made some updates to improve your experience.",
          span: "Hemos realizado algunas actualizaciones para mejorar tu experiencia."
        },
        notice: message,
        types: 'notice',
        getId: null,
      }));

      await Notification.insertMany(notifications);
    } else {
      if (!userId) {
        throw new ApiError(404, 'User ID is required.');
      }

      await NotificationService.sendNotification({
        title: {
          eng: "Important Notice from Administrator",
          span: "Aviso Importante del Administrador"
        },
        message: {
          eng: "We have made some updates to improve your experience.",
          span: "Hemos realizado algunas actualizaciones para mejorar tu experiencia."
        },
        user: userId,
        userType: 'User',
        getId: null,
        notice: message,
        types: 'notice',
      });
    }

    // log=====
    const newTask = {
      admin: admin,
      email: emailAuth,
      description: `Notification was successfully sent to user with ${all_user ? "all User" : `ID ${userId}`}.`,
      types: "Create",
      activity: "reglue",
      status: "Success",
    };
    await LogsDashboardService.createTaskDB(newTask)
    // ====
    return { massage: "Notification(s) sent successfully." };
  } catch (error) {
    // log=====
    const newTask = {
      admin: admin,
      email: emailAuth,
      description: `An error occurred while sending partner notifications: ${error.message || "Unknown error"}.`,
      types: "Failed",
      activity: "reglue",
      status: "Error",
    };
    await LogsDashboardService.createTaskDB(newTask)
    // ====
    throw new ApiError(500, "An error occurred while sending notifications.");
  }
};

const sendNoticePartner = async (req, res) => {
  const { userId, all_user } = req.query;
  const { title, message } = req.body;
  const { userId: admin, emailAuth } = req.user;
  try {
    if (!title || !message) {
      throw new ApiError(400, 'Title and message are required.');
    }

    if (all_user) {
      const users = await Partner.find({});
      const notifications = users.map(user => ({
        title: {
          eng: "Important Notice from Administrator",
          span: "Aviso Importante del Administrador"
        },
        message: {
          eng: "We have made some updates to improve your experience.",
          span: "Hemos realizado algunas actualizaciones para mejorar tu experiencia."
        },
        user: user._id,
        userType: 'Partner',
        getId: null,
        notice: message,
        types: 'notice',
      }));

      await Notification.insertMany(notifications);
    } else {

      if (!userId) {
        throw new ApiError(404, 'User ID is required.');
      }

      await NotificationService.sendNotification({
        title: {
          eng: "Important Notice from Administrator",
          span: "Aviso Importante del Administrador"
        },
        message: {
          eng: "We have made some updates to improve your experience.",
          span: "Hemos realizado algunas actualizaciones para mejorar tu experiencia."
        },
        user: userId,
        userType: 'Partner',
        getId: null,
        notice: message,
        types: 'notice',
      });

    }
    // log=====
    const newTask = {
      admin: admin,
      email: emailAuth,
      description: `Notification was successfully sent to partner with ${all_user ? "all partner" : `ID ${userId}`}.`,
      types: "Create",
      activity: "reglue",
      status: "Success",
    };
    await LogsDashboardService.createTaskDB(newTask)
    // ====
    return { massage: "Notification(s) sent successfully." };
  } catch (error) {
    // log=====
    const newTask = {
      admin: admin,
      email: emailAuth,
      description: `An error occurred while sending partner notifications: ${error.message || "Unknown error"}.`,
      types: "Failed",
      activity: "reglue",
      status: "Error",
    };
    await LogsDashboardService.createTaskDB(newTask)
    // ====
    throw new ApiError(500, "An error occurred while sending notifications.");
  }
};

const getTransactionsHistory = async (req) => {
  const query = req.query; 
  try {
    const servicesQuery = new QueryBuilder(Transaction.find()
      .populate("receiveUser", "name email profile_image")
      .populate("payUser", "name email profile_image")
      .populate({
        path: "serviceId",
        select: "service category price",
        populate: {
          path: "category",
          select: "_id category",
        },
      })
      , query)
      .search(["paymentStatus", "transactionId"])
      .filter()
      .sort()
      .paginate()
      .fields()


    servicesQuery.modelQuery


    const result = await servicesQuery.modelQuery;
    const meta = await servicesQuery.countTotal();

    console.log(result)

    return { result, meta };
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
      .populate("receiveUser", "name email profile_image")
      .populate("payUser", "name email profile_image")
      .populate({
        path: "serviceId",
        populate: {
          path: "category",
          select: "_id category",
        },
      });
    if (!result) {
      throw new ApiError(404, "Transaction not found.");
    }

    return result;
  } catch (error) {
    console.error("Error fetching transaction details:", error.message || error);
    throw new ApiError(500, "Internal Server Error");
  }
};

// =======================

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
  getTransactionsDetails,
  getPaddingPartner,
  updateProfile

};

module.exports = { DashboardService };
