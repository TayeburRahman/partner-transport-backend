const { query } = require("express");
const QueryBuilder = require("../../../builder/queryBuilder");
const ApiError = require("../../../errors/ApiError");
const Services = require("./services.model");
const httpStatus = require("http-status");
const { Server } = require("socket.io");
const Partner = require("../partner/partner.model");

const {
  ENUM_SERVICE_STATUS,
  ENUM_SERVICE_TYPE,
  ENUM_PARTNER_AC_STATUS,
  ENUM_USER_ROLE,
} = require("../../../utils/enums");
const Variable = require("../variable/variable.model");
const { Transaction } = require("../payment/payment.model");
const { default: mongoose } = require("mongoose");
const { Bids } = require("../bid/bid.model");
const User = require("../user/user.model");
const { NotificationService } = require("../notification/notification.service");
const VariableCount = require("../variable/variable.count");

// =USER============================= 
const validateInputs = (data, image) => {
  const requiredFields = [
    "service", "category", "scheduleDate", "scheduleTime", "numberOfItems",
    "weightMTS", "weightKG", "description", "deadlineDate", "deadlineTime",
    "isLoaderNeeded", "loadFloorNo", "loadingAddress", "loadLongitude",
    "loadLatitude", "mainService"
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      throw new ApiError(400, `${field} is required.`);
    }
  }

  const validServices = {
    move: ["Goods", "Waste"],
    sell: ["Second-hand items", "Recyclable materials"]
  };

  const validServiceForMain = validServices[data.mainService];
  if (!validServiceForMain.includes(data.service)) {
    throw new ApiError(400, `For ${data.mainService}, you must choose between ${validServiceForMain.join(' or ')}.`);
  }

  if (!image?.length) {
    throw new ApiError(400, "At least one image is required.");
  }

  const images = Array.isArray(image) ? image.map(file => `/images/services/${file.filename}`) : [];

  const timePattern = /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;

  if (!timePattern.test(data.scheduleTime)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid scheduleTime format. Please use hh:mm AM/PM.");
  }

  if (!timePattern.test(data.scheduleTime)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid scheduleTime format. Please use hh:mm AM/PM.");
  }

  return images;
};

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
 

const createPostDB = async (req) => {
  try {
    const { userId } = req.user;
    const { image } = req.files || {};
    const data = req.body;

    const images = validateInputs(data, image);

    const distance = Number(data.distance);
    const formattedDistance = parseFloat(distance?.toFixed(3));

    const serviceData = {
      user: userId,
      mainService: data.mainService,
      service: data.service,
      category: data.category,
      scheduleDate: data.scheduleDate,
      scheduleTime: data.scheduleTime,
      numberOfItems: Number(data.numberOfItems),
      weightMTS: Number(data.weightMTS),
      weightKG: Number(data.weightKG),
      description: data.description,
      deadlineDate: data.deadlineDate,
      deadlineTime: data.deadlineTime,
      isLoaderNeeded: data.isLoaderNeeded,
      loadFloorNo: data.loadFloorNo,
      isUnloaderNeeded: data.isUnloaderNeeded,
      unloadFloorNo: data.unloadFloorNo,
      loadingAddress: data.loadingAddress,
      unloadingAddress: data.unloadingAddress,
      image: images,
      doYouForWaste: data.doYouForWaste,
      minPrice: data?.minPrice,
      bids: [],
      confirmedPartner: null,
      loadingLocation: {
        coordinates: [Number(data.loadLongitude), Number(data.loadLatitude)],
      },
      unloadingLocation: {
        coordinates: [
          Number(data.unloadLongitude || 0),
          Number(data.unloadLatitude || 0),
        ],
      },
      price: data.price,
      distance: formattedDistance
    };

    const newService = new Services(serviceData);
    console.log(newService)
    return await newService.save();

  } catch (error) {
    throw new ApiError(400, error.message || 'Error while creating post');
  }
};

const updatePostDB = async (req) => {
  const { serviceId } = req.params;
  try {
    const { image } = req.files;
    const updateData = req.body;
    const existingService = await Services.findById(serviceId);
    if (!existingService) {
      throw new ApiError(404, "Service not found");
    }
    const updatedServiceData = {
      ...updateData,
      image: image ? image.map((img) => img.path) : existingService.image,
    };

    const result = await Services.findByIdAndUpdate(
      serviceId,
      updatedServiceData
    );

    return result;
  } catch (error) {
    throw new ApiError(400, error.message);
  }
};

const getDetails = async (req) => {
  const { serviceId } = req.params;

  const result = await Services.findById(serviceId)
    .populate({
      path: "category",
      select: "_id category",
    })
    .populate({
      path: "bids",
      populate: [
        // {
        //   path: "service",
        //   model: "Services",
        // },
        {
          path: "partner",
          model: "Partner",
          select: "_id profile_image rating name rating",
        },
      ],
    })
    .populate("confirmedPartner");
  if (!result) {
    throw new ApiError(404, "Service not found");
  }
  const pisoVariable = await VariableCount.getPisoVariable();
  return { result, piso: pisoVariable };
};

const getUserPostHistory = async (req) => {
  const { userId } = req.user;
  const query = req.query;

  const dataQuery = new QueryBuilder(Services.find({ user: userId })
    .populate({
      path: "category",
      select: "_id category",
    })
    , query)
    .search([])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await dataQuery.modelQuery;
  const meta = await dataQuery.countTotal();

  const pisoVariable = await VariableCount.getPisoVariable();

  return { piso: pisoVariable, result, meta };
};

const deletePostDB = async (req) => {
  const { serviceId } = req.params;
  const service = await Services.findById(serviceId);
  if (!service) {
    throw new ApiError(404, "Service not found");
  }
  const result = await Services.findByIdAndDelete(serviceId);
  return result._id;
};

const conformPartner = async (req) => {
  const { serviceId, partnerId, bidId } = req.query;

  const service = await Services.findById(serviceId);
  if (!service) {
    throw new ApiError(404, "Service not found");
  }
  const partner = await Partner.findOne({ _id: partnerId });

  if (!partner) {
    throw new ApiError(
      404,
      "Partner account is Deactivated, please find another partner."
    );
  }

  const bidDetails = await Bids.findOne({
    service: serviceId,
    partner: partnerId,
  });

  if (!bidDetails) {
    throw new ApiError(404, "Bid not found for this service and partner.");
  }

  const result = await Services.findByIdAndUpdate(
    serviceId,
    {
      confirmedPartner: partnerId,
      status: ENUM_SERVICE_STATUS.ACCEPTED,
      winBid: bidDetails.price,
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

  await NotificationService.sendNotification({
    title: "You’ve Won the Bid!",
    message: `Congratulations! Your bid for service has been accepted.`,
    user: partnerId,
    userType: 'Partner',
    types: 'service',
    getId: serviceId,
  });

  return {
    service: result,
  };
};

const getServicePostUser = async (req) => {
  const { userId } = req.user;
  const { serviceType, status } = req.query;

  if (!serviceType || !status) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Missing service type or status"
    );
  }

  let type;
  if (serviceType === "sell") {
    type = [
      ENUM_SERVICE_TYPE.SECOND_HAND_ITEMS,
      ENUM_SERVICE_TYPE.RECYCLABLE_MATERIALS,
    ];
  } else {
    type = [ENUM_SERVICE_TYPE.GOODS, ENUM_SERVICE_TYPE.WASTE];
  }

  const result = await Services.find({
    service: { $in: type },
    status: status,
    user: userId,
  });

  return result;
};

const rescheduledPostUser = async (req) => {
  const { userId } = req.user;
  const { serviceId } = req.params;
  const { rescheduledReason, rescheduledTime, rescheduledDate } = req.body;

  if (!rescheduledDate || !rescheduledTime) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Rescheduled Time and Date are required!"
    );
  }

  const service = await Services.findById(serviceId);
  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service not found!");
  }

  console.log("service: ", service)

  const result = await Services.findOneAndUpdate(
    { _id: serviceId },
    {
      rescheduledReason,
      rescheduledTime,
      rescheduledDate,
      rescheduledStatus: "pending",
      status: ENUM_SERVICE_STATUS.RESCHEDULED,
    },
    { new: true }
  );

  return result;
};

// =PARTNER=================================
const searchNearby = async (req) => {
  const { longitude, latitude, service } = req.query;
  const { userId } = req.user;

  if (!longitude || !latitude) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing longitude or latitude");
  }

  const lng = Number(longitude);
  const lat = Number(latitude);

  if (isNaN(lng) || isNaN(lat)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid longitude or latitude");
  }

  const { coverageRadius } = await Variable.findOne({});

  const nearbyServices = await Services.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng, lat],
        },
        distanceField: "distance",
        spherical: true,
        maxDistance: coverageRadius ? Number(coverageRadius * 1000) : Number(10000 * 1000),
      },
    },
    {
      $match: {
        status: ENUM_SERVICE_STATUS.PENDING,
        service: service,
      },
    },
    {
      $project: {
        distance: 1,
        numberOfItems: 1,
        mainService: 1,
        category: 1,
        image: 1,
        createdAt: 1,
        scheduleDate: 1,
        scheduleTime: 1,
        deadlineDate: 1,
        deadlineTime: 1,
        deadlineDate: 1,
        loadingLocation: 1,
      },
    },
  ])


  const populatedServices = await Services.populate(nearbyServices, 'category');

  return {
    count: populatedServices.length,
    populatedServices,
  };
};

const rescheduledAction = async (req) => {
  const { serviceId, rescheduledStatus } = req.query;

  if (!serviceId || !rescheduledStatus) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "serviceId and rescheduledStatus are required in the query!"
    );
  }

  const service = await Services.findById(serviceId);
  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service not found!");
  }

  // Validate rescheduledStatus
  if (!["accepted", "decline"].includes(rescheduledStatus)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid rescheduledStatus value!"
    );
  }

  // Define the update object
  const updateFields = { rescheduledStatus };

  if (rescheduledStatus === "accepted") {
    updateFields.status = ENUM_SERVICE_STATUS.ACCEPTED;
    updateFields.rescheduledStatus = ENUM_SERVICE_STATUS.ACCEPTED;
    updateFields.scheduleTime = service.rescheduledTime;
    updateFields.scheduleDate = service.rescheduledDate;
  } else if (rescheduledStatus === "decline") {
    updateFields.rescheduledStatus = ENUM_SERVICE_STATUS.DECLINED;
    updateFields.status = ENUM_SERVICE_STATUS.ACCEPTED;
  }

  const result = await Services.findOneAndUpdate(
    { _id: serviceId },
    updateFields,
    { new: true }
  );

  return result;
};

const getUserServicesWithinOneHour = async (req) => {
  const { userId, role } = req.user;
  const now = new Date();

  const formattedDate = formatDate(now);
  const formattedStartTime = formatTimeTo12hrs(now);

  const oneHourBefore = new Date(now.getTime() + 60 * 60 * 1000);
  const formattedStartRange = formatTimeTo12hrs(oneHourBefore);

  const query = {
    status: { $in: ["accepted", "rescheduled", "pick-up", "in-progress"] },
    scheduleDate: {
      $lte: formattedDate,
    },
    scheduleTime: {
      // $gte: formattedStartRange, 
      $lte: formattedStartRange
    }
  };

  if (role === 'USER') {
    query.user = userId;
  } else if (role === 'PARTNER') {
    query.confirmedPartner = userId;
  }

  const services = await Services.find(query)
    .populate({
      path: "confirmedPartner",
      select: "name email profile_image phone_number rating",
    })
    .populate({
      path: "user",
      select: "name email profile_image phone_number rating",
    })
    .populate({
      path: "category",
      select: "_id category",
    });

  // console.log("Fetched services:", services);
  return services;
};

function formatTimeTo12hrs(date) {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

const filterUserByHistory = async (req) => {
  const { categories, serviceType, serviceStatus } = req.query;
  const { userId } = req.user;
  let service;
  if (serviceType === "move") {
    service = ["Goods", "Waste"];
  } else if (serviceType === "sell") {
    service = ["Second-hand items", "Recyclable materials"];
  } else {
    service = ["Second-hand items", "Recyclable materials", "Goods", "Waste"]
  }

  const query = req.query;

  const filtered = new QueryBuilder(
    Services.find({
      user: userId,
      service,
      status: serviceStatus,
    })
      .populate({
        path: "user",
        select: "profile_image name email",
      })
      .populate({
        path: "confirmedPartner",
        select: "profile_image name email",
      })
      .populate({
        path: "category",
        select: "_id category",
      }),
    query
  )
    .sort()
    .paginate();

  const result = await filtered.modelQuery;
  const meta = await filtered.countTotal();

  const pisoVariable = await VariableCount.getPisoVariable();
  return { result, meta, piso: pisoVariable };
};

// Status===========================
const updateServicesStatusPartner = async (req) => {
  const { serviceId, status } = req.query;

  if (!serviceId || !status) {
    throw new ApiError(
      httpStatus.BAD_REQUEST, "Service ID and status are required in the query parameters.");
  }

  const service = await Services.findById(serviceId);
  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service with the given ID not found.");
  }

  if (!Object.values(ENUM_SERVICE_STATUS).includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status provided.");
  }
  console.log("service", service.status)
  if (status === "arrived" && service.status !== "accepted") {
    throw new ApiError(httpStatus.BAD_REQUEST, "User must confirm pending status before arriving.");
  }

  console.log("status==", status)

  if (status === "start-trip" && service.user_status !== "goods-loaded") {
    throw new ApiError(httpStatus.BAD_REQUEST, "User must confirm goods are loaded before starting the trip.");
  }

  if (status === "arrive-at-destination" && (service.partner_status !== "start-trip" || service.user_status !== "goods-loaded")) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Trip must be started and goods must be loaded before arriving at the destination.");
  }

  if (status === "delivered" && service.user_status !== "partner-at-destination") {
    throw new ApiError(httpStatus.BAD_REQUEST, "User must confirm partner is at the destination before marking as delivered.");
  }

  let service_status = service.status;
  if (status === "start-trip") {
    service_status = "in-progress";
  }

  const result = await Services.findOneAndUpdate(
    { _id: serviceId },
    { partner_status: status, status: service_status },
    { new: true }
  );

  await NotificationService.sendNotification({
    title: "Service Status Updated",
    message: `The service status has been updated to "${status}".`,
    user: service.user,
    userType: "User",
    types: "ongoing",
    getId: serviceId,
  });

  return result;
};

const updateServicesStatusUser = async (req) => {
  const { serviceId, status } = req.query;
  const { userId } = req.user;

  if (!serviceId || !status) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Service ID and status are required in the query parameters.");
  }

  const service = await Services.findById(serviceId);
  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service not found.");
  }

  if (service.paymentStatus !== "paid") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Payment must be completed before you can update the status.");
  }

  if (!Object.values(ENUM_SERVICE_STATUS).includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status provided.");
  }

  if (status === "confirm-arrived" && service.partner_status !== "arrived") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Partner must mark arrival before confirming arrival.");
  }

  if (status === "goods-loaded" && (service.user_status !== "confirm-arrived" || service.partner_status !== "arrived")) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Partner must arrive and user must confirm arrival before loading goods.");
  }

  if (status === "partner-at-destination" && service.partner_status !== "arrive-at-destination") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Partner must arrive at destination before confirming destination.");
  }

  if (status === "delivery-confirmed" && service.partner_status !== "delivered") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Partner must mark delivery before confirming delivery.");
  }

  const transaction = await Transaction.findOne({ serviceId });
  if (!transaction || transaction.paymentStatus !== "Completed") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Payment is not completed.");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const receivedUser =
      transaction.receiveUserType === "Partner"
        ? await Partner.findById(transaction.receiveUser)
        : await User.findById(transaction.receiveUser);

    if (!receivedUser) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Recipient user not found for the transaction."
      );
    }

    if (status === "delivery-confirmed") {
      receivedUser.wallet += transaction.amount;
      await receivedUser.save({ session });

      transaction.isFinish = true;
      await transaction.save({ session });

      await NotificationService.sendNotification({
        title: "Payment Received",
        message: `You have received a payment of ${transaction.amount} for the service.`,
        user: receivedUser._id,
        userType: transaction.receiveUserType,
        types: "complete-status",
        getId: serviceId,
      });
    }

    let serviceStatus = service.status;
    if (status === "goods-loaded") {
      serviceStatus = "pick-up";
    } else if (status === "delivery-confirmed") {
      serviceStatus = "completed";
    }

    const updatedService = await Services.findByIdAndUpdate(
      serviceId,
      { user_status: status, status: serviceStatus },
      { new: true, session }
    );

    await NotificationService.sendNotification({
      title: "Service Status Updated",
      message: `The service status has been updated to "${status}".`,
      user: service.confirmedPartner,
      userType: "Partner",
      types: serviceStatus === "completed" ? "complete-status" : "ongoing",
      getId: serviceId,
    });

    await session.commitTransaction();
    return updatedService;
  } catch (error) {
    await session.abortTransaction();
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Error updating service status: ${error.message}`
    );
  } finally {
    session.endSession();
  }
};

// ---------------
const updateSellServicesStatusUser = async (req) => {
  const { serviceId, status } = req.query;
  const { userId } = req.user;

  if (!serviceId || !status) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Service ID and status are required in the query parameters.");
  }

  const service = await Services.findById(serviceId);
  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service not found.");
  }

  if (service.paymentStatus !== "paid") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Payment must be completed before you can update the status.");
  }

  if (!Object.values(ENUM_SERVICE_STATUS).includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status provided.");
  }

  if (status === "confirm-arrived" && service.partner_status !== "arrived") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Partner must mark arrival before confirming arrival.");
  }

  if (status === "delivered" && (service.user_status !== "confirm-arrived" || service.partner_status !== "arrived")) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Partner must arrive and user must confirm arrival before loading goods.");
  }


  const transaction = await Transaction.findOne({ serviceId });
  if (!transaction || transaction.paymentStatus !== "Completed") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Payment is not completed.");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const receivedUser =
      transaction.receiveUserType === "Partner"
        ? await Partner.findById(transaction.receiveUser)
        : await User.findById(transaction.receiveUser);

    if (!receivedUser) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Recipient user not found for the transaction."
      );
    }

    const updatedService = await Services.findByIdAndUpdate(
      serviceId,
      { user_status: status, },
      { new: true, session }
    );

    await NotificationService.sendNotification({
      title: "Service Status Updated",
      message: `The service status has been updated to "${status}".`,
      user: service.confirmedPartner,
      userType: "Partner",
      types: "service",
      getId: serviceId,
    });

    await session.commitTransaction();
    return updatedService;
  } catch (error) {
    await session.abortTransaction();
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Error updating service status: ${error.message}`
    );
  } finally {
    session.endSession();
  }
};

const updateSellServicesStatusPartner = async (req) => {
  const { serviceId, status } = req.query;

  if (!serviceId || !status) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Service ID and status are required.");
  }

  const service = await Services.findById(serviceId);
  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, `Service with ID "${serviceId}" not found.`);
  }

  if (!Object.values(ENUM_SERVICE_STATUS).includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid status "${status}" provided.`);
  }

  const STATUS_TRANSITIONS = {
    arrived: ["accepted"],
    "delivery-confirmed": ["delivered"],
  };

  if (STATUS_TRANSITIONS[status] && !STATUS_TRANSITIONS[status].includes(service.status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot set status to "${status}" from "${service.status}".`
    );
  }

  const transaction = await Transaction.findOne(
    { serviceId },
    "paymentStatus receiveUserType receiveUser amount isFinish"
  );

  if (!transaction || transaction.paymentStatus !== "Completed") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Payment is not completed.");
  }

  const receivedUser = await (transaction.receiveUserType === "Partner"
    ? Partner
    : User
  ).findById(transaction.receiveUser);

  if (!receivedUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "Recipient user not found for the transaction.");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (status === "delivery-confirmed") {
      receivedUser.wallet = (receivedUser.wallet || 0) + transaction.amount;
      await receivedUser.save({ session });

      transaction.isFinish = true;
      await transaction.save({ session });

      await NotificationService.sendNotification({
        title: "Payment Received",
        message: `You have received a payment of ${transaction.amount} for the service.`,
        user: receivedUser._id,
        userType: transaction.receiveUserType,
        types: "complete-status",
        getId: serviceId,
      });
    }

    const updatedServiceStatus =
      status === "arrived" ? "in-progress" :
        status === "delivery-confirmed" ? "completed" :
          service.status;

    const result = await Services.findOneAndUpdate(
      { _id: serviceId },
      { partner_status: status, status: updatedServiceStatus },
      { new: true, session }
    );

    await NotificationService.sendNotification({
      title: "Service Status Updated",
      message: `The service status has been updated to "${status}".`,
      user: service.user,
      userType: "User",
      types: "service",
      getId: serviceId,
    });

    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    console.error("Transaction failed:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

// Status===========================

const ServicesService = {
  createPostDB,
  updatePostDB,
  deletePostDB,
  getDetails,
  getUserPostHistory,
  searchNearby,
  conformPartner,
  getServicePostUser,
  getUserServicesWithinOneHour,
  rescheduledPostUser,
  rescheduledAction,
  updateServicesStatusPartner,
  filterUserByHistory,
  updateServicesStatusUser,
  updateSellServicesStatusUser,
  updateSellServicesStatusPartner
};

module.exports = { ServicesService };


