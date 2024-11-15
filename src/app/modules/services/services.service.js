const { query } = require("express");
const QueryBuilder = require("../../../builder/queryBuilder");
const ApiError = require("../../../errors/ApiError");
const Services = require("./services.model");
const httpStatus = require("http-status");
const { Server } = require("socket.io");
const Partner = require("../partner/partner.model");
const Bids = require("../bid/bid.model");
const {
  ENUM_SERVICE_STATUS,
  ENUM_SERVICE_TYPE,
  ENUM_PARTNER_AC_STATUS,
  ENUM_USER_ROLE,
} = require("../../../utils/enums");
const Variable = require("../variable/variable.model");

// --------------USER--------------------------------
const validateScheduleInputs = (scheduleDate, scheduleTime) => {
  const datePattern = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
  const timePattern = /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;

  const isDateValid = datePattern.test(scheduleDate);
  const isTimeValid = timePattern.test(scheduleTime);

  if (!isDateValid) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid scheduleDate format. Please use MM-DD-YYYY."
    );
  }
  if (!isTimeValid) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid scheduleTime format. Please use hh:mm AM/PM."
    );
  }
  return true;
};
// Integrate validation into the createPostDB function
const createPostDB = async (req) => {
  try {
    const { userId } = req.user;
    const { image } = req.files || {};
    const data = req.body;

    const requiredFields = [
      "service",
      "category",
      "scheduleDate",
      "scheduleTime",
      "numberOfItems",
      "weightMTS",
      "weightKG",
      "description",
      "deadlineDate",
      "deadlineTime",
      "isLoaderNeeded",
      "loadFloorNo",
      "loadingAddress",
      "loadLongitude",
      "loadLatitude",
      // "price",
      // "distance",
    ];

    // Validate required fields
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new ApiError(400, `${field} is required.`);
      }
    }

    // Validate image
    if (!image || !image.length) {
      throw new ApiError(400, "At least one image is required.");
    }

    let images = []; 
  

    if (image && Array.isArray(image)) { 
      images = image.map(file => `/images/services/${file.filename}`);
    }

    // Validate scheduleDate and scheduleTime formats
    validateScheduleInputs(data.scheduleDate, data.scheduleTime);

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
      isLoaderNeeded: data.isLoaderNeeded === "true",
      loadFloorNo: data.loadFloorNo,
      isUnloaderNeeded: data.isUnloaderNeeded === "true",
      unloadFloorNo: data.unloadFloorNo,
      loadingAddress: data.loadingAddress,
      unloadingAddress: data.unloadingAddress,
      image: images,
      doYouForWaste: data.doYouForWaste === "true",
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
      distance: data.distance,
    };

    const newService = new Services(serviceData);
    const result = await newService.save();

    return result;
  } catch (error) {
    throw new ApiError(401, error.message);
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

// const getPaddingService = async (req) => { 

//   const result = await Services.find({}).sort({ createdAt: -1 })
//   if (!result) {
//     throw new ApiError(404, "Service not found");
//   }
//   return result;
// };

const getDetails = async (req) => {
  const { serviceId } = req.params;

  const result = await Services.findById(serviceId)
    .populate({
      path: "bids",
      populate: [
        {
          path: "service",
          model: "Services",
        },
        {
          path: "partner",
          model: "Partner",
        },
      ],
    })
    .populate("confirmedPartner");
  if (!result) {
    throw new ApiError(404, "Service not found");
  }
  return result;
};

const getUserPostHistory = async (req) => {
  const { userId } = req.user;
  const query = req.query;

  const dataQuery = new QueryBuilder(Services.find({ user: userId }), query)
    .search([])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await dataQuery.modelQuery;
  const meta = await dataQuery.countTotal();

  return { data: result, meta };
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

  validateScheduleInputs(rescheduledDate, rescheduledTime);

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

// ----------------PARTNER---------------------------------
const searchNearby = async (req) => {
  const { longitude, latitude } = req.query;
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
        maxDistance: coverageRadius ? coverageRadius : 10000,
      },
    },
    {
      $match: { status: ENUM_SERVICE_STATUS.PENDING },
    },
    {
      $project: {
        distance: 1,
        numberOfItems: 1,
        mainService: 1,
        category: 1,
        image: 1,
        createdAt: 1,
      },
    },
  ]);

  if (nearbyServices.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "No nearby services found");
  }

  return {
    count: nearbyServices.length,
    nearbyServices,
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

  if (service.rescheduledStatus !== "pending") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Service is not in a pending state for rescheduling!"
    );
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
    updateFields.scheduleTime = service.rescheduledTime;
    updateFields.scheduleDate = service.rescheduledDate;
  } else if (rescheduledStatus === "decline") {
    updateFields.status = ENUM_SERVICE_STATUS.DECLINED;
  }

  const result = await Services.findOneAndUpdate(
    { _id: serviceId },
    updateFields,
    { new: true }
  );

  return result;
}; 

// -----------------------------------------
const getUserServicesWithinOneHour = async (req) => {
  const { userId, role } = req.user;
  const now = new Date();

  const currentTime = now.getTime();
  const oneHourLater = new Date(currentTime + 60 * 60 * 1000);
  const formattedDate = `${now.getMonth() + 1
    }/${now.getDate()}/${now.getFullYear()}`;

  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  const startTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    currentHours,
    currentMinutes
  );
  const endTime = new Date(
    oneHourLater.getFullYear(),
    oneHourLater.getMonth(),
    oneHourLater.getDate(),
    oneHourLater.getHours(),
    oneHourLater.getMinutes()
  );

  const query = {
    status: { $in: ["accepted", "rescheduled"] },
    scheduleDate: formattedDate,
    scheduleTime: {
      $gte: startTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      $lt: endTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  };

  let services;
  if (role === ENUM_USER_ROLE.USER) {
    query.user = userId;
  } else if (role === ENUM_USER_ROLE.PARTNER) {
    query.confirmedPartner = userId;
  } else {
    throw new Error("Invalid user role");
  }
  services = await Services.find(query);

  return services;
};

const filterUserByHistory = async (req) => {
  const { categories, serviceType, serviceStatus } = req.query;
  const { userId } = req.user;
  let service;
  if (serviceType === "move") {
    service = ["Goods", "Waste"];
  }
  if (serviceType === "sell") {
    service = ["Second-hand items", "Recyclable materials"];
  }

 const query = req.query;
 
  const filtered = new QueryBuilder(Services.find({
    user: userId,
    service,
    status: serviceStatus,
  }), query)  
    .sort()
    .paginate() 

  const result = await filtered.modelQuery;
  const meta = await filtered.countTotal();

  return { result, meta };
};

// ----------------------------
const updateServicesStatusPartner = async (req) => {
  const { serviceId, status } = req.query;

  if (!serviceId || !status) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Service ID and status are required in the query parameters."
    );
  }

  const service = await Services.findById(serviceId);
  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service with the given ID not found.");
  }

  if (!Object.values(ENUM_SERVICE_STATUS).includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status provided.");
  }

  // Validation of status transitions for partner
  if (status === "arrived" && service.status !== "accepted") {
    throw new ApiError(httpStatus.BAD_REQUEST, "User must confirm pending status before arriving.");
  }

  if (status === "start-trip" && service.user_status !== "goods-loaded") {
    throw new ApiError(httpStatus.BAD_REQUEST, "User must confirm goods are loaded before starting the trip.");
  }

  if (status === "arrive-at-destination" && (service.partner_status !== "start-trip" || service.user_status !== "goods-loaded")) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Trip must be started and goods must be loaded before arriving at the destination.");
  }

  if (status === "delivered" && service.user_status !== "partner-at-destination") {
    throw new ApiError(httpStatus.BAD_REQUEST, "User must confirm partner is at the destination before marking as delivered.");
  }

  // Determine service status based on partner action
  let service_status = service.status;
  if (status === "start-trip") {
    service_status = "in-progress";
  }

  const result = await Services.findOneAndUpdate(
    { _id: serviceId },
    { partner_status: status, status: service_status },
    { new: true }
  );

  return result;
};

const updateServicesStatusUser = async (req) => {
  const { serviceId, status } = req.query;

  if (!serviceId || !status) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Service ID and status are required in the query parameters."
    );
  }

  const service = await Services.findById(serviceId);
  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service with the given ID not found.");
  }

  if (!Object.values(ENUM_SERVICE_STATUS).includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status provided.");
  }

  // Validation of status transitions for user
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

  // Determine service status based on user action
  let service_status = service.status;
  if (status === "goods-loaded") {
    service_status = "pick-up";
  } else if (status === "delivery-confirmed") {
    service_status = "completed";
  }

  const result = await Services.findOneAndUpdate(
    { _id: serviceId },
    { user_status: status, status: service_status },
    { new: true }
  );

  return result;
};

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
};

module.exports = { ServicesService };
