const QueryBuilder = require("../../../builder/queryBuilder");
const ApiError = require("../../../errors/ApiError");
const { FileClaim } = require("../bid/bid.model");
const { Withdraw } = require("../payment/payment.model");
const Services = require("../services/services.model");
const { Tickets } = require("../support/support.model");
const { LogAdmin } = require("./logsdashboard.model");

//Create logs  ==
const createTaskDB = async ({ admin, email, description, types, activity, status, attended }) => {
  try {
    const task = new LogAdmin({
      admin,
      email,
      description,
      types,
      activity,
      status,
      attended
    });
    await task.save(); 
  } catch (error) {
    throw new ApiError(`Failed to create task: ${error?.message}`);
  }
};

// Audit Dashboards ================================
const eventsCreationRate = async (query) => {
  const { year, month = "all", service } = query;
  const filter = {};
  let startDate, endDate;

  if (year) {
    if (month !== "all") {
      const monthInt = parseInt(month, 10);

      startDate = new Date(`${year}-${monthInt}-01`);

      endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + 1);
      endDate.setDate(0);
    } else {
      startDate = new Date(`${year}-01-01`);
      endDate = new Date(`${parseInt(year) + 1}-01-01`);
    }
  } else {
    const currentDate = new Date();
    startDate = new Date(`${currentDate.getFullYear()}-01-01`);
    endDate = new Date(`${currentDate.getFullYear() + 1}-01-01`);
  }

  if (service) {
    filter.service = service;
  }

  filter.createdAt = { $gte: startDate, $lt: endDate };

  const events = await Services.find(filter).select("service scheduleDate createdAt");

  const serviceCounts = {
    Goods: 0,
    Waste: 0,
    "Second_hand_items": 0,
    "Recyclable_materials": 0,
  };

  events.forEach((event) => {
    if (serviceCounts[event.service] !== undefined) {
      serviceCounts[event.service] += 1;
    }
  });

  const totalEvents = events.length;

  const totalDays = (endDate - startDate) / (1000 * 3600 * 24);
  const eventsCreationRate = totalDays ? (totalEvents / totalDays).toFixed(2) : 0;

  const mostCommonEventType = Object.keys(serviceCounts).reduce((a, b) =>
    serviceCounts[a] > serviceCounts[b] ? a : b
  );

  return {
    totalEvents,
    mostCommonEventType,
    eventsCreationRate,
    serviceCounts
  };
};

const getMostCreatedUsers = async (req) => {
  try {
    const { searchQuery = '', page = 1, limit = 50 } = req.query
    const pageSize = parseInt(limit, 10);
    const sanitizedSearchQuery = searchQuery ? String(searchQuery) : '';

    const mostCreatedUsers = await Services.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $match: sanitizedSearchQuery
          ? {
            "userDetails.name": { $regex: sanitizedSearchQuery, $options: "i" },
          }
          : {},
      },
      {
        $group: {
          _id: "$user",
          serviceCount: { $sum: 1 },
        },
      },
      {
        $sort: { serviceCount: -1 },
      },
      {
        $skip: (page - 1) * pageSize,
      },
      {
        $limit: pageSize,
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {

        $project: {
          name: "$userDetails.name",
          email: "$userDetails.email",
          image: "$userDetails.image",
          serviceCount: 1,
        },
      },
    ]);

    const totalUsersCount = await Services.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $match: sanitizedSearchQuery
          ? {
            "userDetails.name": { $regex: sanitizedSearchQuery, $options: "i" },
          }
          : {},
      },
      {
        $group: {
          _id: "$user",
        },
      },
    ]);

    const totalCount = totalUsersCount.length;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      totalUsers: totalCount,
      totalPages: totalPages,
      currentPage: page,
      users: mostCreatedUsers,
    };
  } catch (error) {
    console.error("Error fetching most created users:", error);
    throw error;
  }
};

const getAdminTaskCompted = async (req) => {
  const { page = 1, limit = 10, searchTerm } = req.query;
  const matchStage = {
    activity: "task",
    status: "Success",
  };

  if (searchTerm) {
    matchStage.email = { $regex: searchTerm, $options: "i" };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const summary = await LogAdmin.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$admin",
        email: { $first: "$email" },
        ticketsAttended: {
          $sum: {
            $cond: [{ $eq: ["$attended", "tickets"] }, 1, 0],
          },
        },
        complaintsAttended: {
          $sum: {
            $cond: [{ $eq: ["$attended", "complaints"] }, 1, 0],
          },
        },
        withdrawAttended: {
          $sum: {
            $cond: [{ $eq: ["$attended", "withdraw"] }, 1, 0],
          },
        },
        totalTasksCompleted: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "admins",
        localField: "_id",
        foreignField: "_id",
        as: "adminDetails",
      },
    },
    { $unwind: "$adminDetails" },
    {
      $project: {
        _id: 0,
        adminId: "$_id",
        name: "$adminDetails.name",
        image: "$adminDetails.profile_image",
        email: 1,
        ticketsAttended: 1,
        complaintsAttended: 1,
        withdrawAttended: 1,
        totalTasksCompleted: 1,
      },
    },
    { $sort: { totalTasksCompleted: -1 } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const totalDocuments = await LogAdmin.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$admin",
      },
    },
    { $count: "total" },
  ]);

  const total = totalDocuments[0]?.total || 0;
  const totalPage = Math.ceil(total / limit);

  return {
    meta: {
      total,
      totalPage,
      page: Number(page),
      limit: Number(limit),
    },
    data: summary,
  };
};

// Active Log==================================
const getActivityLog = async (req) => {
  const { type, status, date, email, searchTerm, page = 1, limit = 10, sort = "-date" } = req.query;

  const filterQuery = {};

  if (type) filterQuery.types = type;
  if (status) filterQuery.status = status;

  if (date) {
    const formattedDate = date;
    filterQuery.date = formattedDate;
  }

  if (email) filterQuery.email = email;

  if (searchTerm) {
    filterQuery.email = { $regex: searchTerm, $options: "i" };
  }

  const skip = (Number(page) - 1) * Number(limit);

  try {
    const data = await LogAdmin.find(filterQuery)
      .populate('admin')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .select("-__v");

    const total = await LogAdmin.countDocuments(filterQuery);

    const totalPage = Math.ceil(total / limit);

    return {
      meta: {
        total,
        totalPage,
        page: Number(page),
        limit: Number(limit),
      },
      data,
    };
  } catch (error) {
    throw new ApiError(500, `An error occurred while fetching activity logs: ${error.message}`);
  }
};

// Supervision Dashboard
const getTaskCompleted = async (req) => {
  const { page = 1, limit = 10, searchTerm } = req.query;

  const matchStage = {
    activity: "task",
    status: "Success",
  };

  if (searchTerm) {
    matchStage.$or = [
      { description: { $regex: searchTerm, $options: "i" } },
      { email: { $regex: searchTerm, $options: "i" } },
      { "adminDetails.name": { $regex: searchTerm, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const results = await LogAdmin.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "admins",
        localField: "admin",
        foreignField: "_id",
        as: "adminDetails",
      },
    },
    { $unwind: "$adminDetails" },
    ...(searchTerm
      ? [
        {
          $match: {
            $or: [
              { description: { $regex: searchTerm, $options: "i" } },
              { email: { $regex: searchTerm, $options: "i" } },
              { "adminDetails.name": { $regex: searchTerm, $options: "i" } },
            ],
          },
        },
      ]
      : []),
    {
      $project: {
        _id: "$adminDetails._id",
        task: "$description",
        assignedAdmin: "$adminDetails.name",
        image: "$adminDetails.profile_image",
        status: "Resolved",
      },
    },
    { $sort: { date: -1, time: -1 } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const totalDocuments = await LogAdmin.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "admins",
        localField: "admin",
        foreignField: "_id",
        as: "adminDetails",
      },
    },
    { $unwind: "$adminDetails" },
    ...(searchTerm
      ? [
        {
          $match: {
            $or: [
              { description: { $regex: searchTerm, $options: "i" } },
              { email: { $regex: searchTerm, $options: "i" } },
              { "adminDetails.name": { $regex: searchTerm, $options: "i" } },
            ],
          },
        },
      ]
      : []),
    { $count: "total" },
  ]);

  const total = totalDocuments[0]?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      total,
      totalPages,
      page: Number(page),
      limit: Number(limit),
    },
    data: results,
  };
};

const getTaskSummary = async () => {
  try {
    const [
      totalFileClaims,
      resolvedFileClaims,
      inProgressFileClaims,
      totalWithdraws,
      completedWithdraws,
      totalTickets,
      repliedTickets,
    ] = await Promise.all([
      // Total FileClaims
      FileClaim.countDocuments({}),
      // FileClaims with status "resolved"
      FileClaim.countDocuments({ status: "resolved" }),
      // FileClaims with status "in-progress"
      FileClaim.countDocuments({ status: "in-progress" }),
      // Total Withdraws
      Withdraw.countDocuments({}),
      // Withdraws with status "Completed"
      Withdraw.countDocuments({ status: "Completed" }),
      // Total Tickets
      Tickets.countDocuments({}),
      // Tickets with status "Replied"
      Tickets.countDocuments({ status: "Replied" }),
    ]);


    const totalTasks = totalFileClaims + totalWithdraws + totalTickets;
    const completedTasks = resolvedFileClaims + completedWithdraws + repliedTickets;
    const tasksInProgress = inProgressFileClaims;
    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;

    return {
      totalTasks,
      completedTasks,
      tasksInProgress,
      completionRate
    };
  } catch (error) {
    throw new Error(`Failed to fetch task summary: ${error.message}`);
  }
};


const LogsDashboardService = {
  eventsCreationRate,
  getMostCreatedUsers,
  getAdminTaskCompted,
  createTaskDB,
  getActivityLog,
  getTaskCompleted,
  getTaskSummary

};

module.exports = { LogsDashboardService };
