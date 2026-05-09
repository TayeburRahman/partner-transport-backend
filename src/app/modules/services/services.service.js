const QueryBuilder = require("../../../builder/queryBuilder");
const ApiError = require("../../../errors/ApiError");
const Services = require("./services.model");
const httpStatus = require("http-status");
const Partner = require("../partner/partner.model");
const config = require("../../../config");
const stripe = require("stripe")(config.stripe.stripe_secret_key);
const {
  ENUM_SERVICE_STATUS,
  ENUM_SERVICE_TYPE,
  ENUM_USER_ROLE,
  ENUM_SOCKET_EVENT,
} = require("../../../utils/enums");
const Variable = require("../variable/variable.model");
const { Transaction, StripeAccount } = require("../payment/payment.model");
const { Bids } = require("../bid/bid.model");
const User = require("../user/user.model");
const { NotificationService } = require("../notification/notification.service");
const VariableCount = require("../variable/variable.count");
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { DateTime } = require("luxon");

dayjs.extend(utc);
dayjs.extend(timezone);

const cron = require("node-cron");
const logger = console;
 
// Cache for surcharge variable to reduce database hits
let surchargeCache = {
  value: null,
  expiry: 0
};

const getSurcharge = async () => {
  const now = Date.now();
  if (surchargeCache.value !== null && surchargeCache.expiry > now) {
    return surchargeCache.value;
  }
  const variable = await Variable.findOne().select("surcharge").lean();
  const surcharge = Number(variable?.surcharge || 0);
  surchargeCache = {
    value: surcharge,
    expiry: now + 5 * 60 * 1000 // Cache for 5 minutes
  };
  return surcharge;
};

const parseDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  // Handle "hh:mm AM/PM" format
  const parts = timeStr.split(" ");
  if (parts.length !== 2) return null;

  const [time, modifier] = parts;
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10) || 0;
  const minute = parseInt(minuteStr, 10) || 0;

  if (modifier === 'PM' && hour < 12) hour += 12;
  if (modifier === 'AM' && hour === 12) hour = 0;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  date.setHours(hour);
  date.setMinutes(minute);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
};


// Revert confirmed partner if payment not made within 1 hour
cron.schedule("* * * * *", async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const expiredPayments = await Services.find({
      status: ENUM_SERVICE_STATUS.ACCEPTED,
      paymentStatus: "pending",
      confirmedAt: { $lte: oneHourAgo },
      confirmedPartner: { $ne: null }
    });

    for (const service of expiredPayments) {
      await Services.findByIdAndUpdate(service._id, {
        $set: {
          confirmedPartner: null,
          status: ENUM_SERVICE_STATUS.PENDING,
          winBid: null,
          confirmedAt: null
        }
      });

      await Bids.updateMany(
        { service: service._id },
        { $set: { status: "Pending" } }
      );

      logger.info(`|=| Reverted service ${service._id} due to payment timeout |=|`);
    }
  } catch (error) {
    logger.error("Payment timeout cron failed:", error);
  }
});

// ===========================
// Check for expired services every minute
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    const expiredServices = await Services.find({
      deadline_utc: { $lte: now },
      confirmedPartner: null,
      bidTimeExtended: false
    }).select("_id bids status bidTimeExtended");

    for (const service of expiredServices) {
      if (!service.bids || service.bids.length === 0) {

        await Services.findByIdAndUpdate(service._id, {
          $set: { status: ENUM_SERVICE_STATUS.CANCEL, bidTimeExtended: true }
        });
        logger.info(`Service ${service._id} cancelled (expired with no bids)`);
      } else {

        await Services.findByIdAndUpdate(service._id, {
          $set: { bidTimeExtended: true }
        });
        logger.info(`Service ${service._id} marked as bidTimeExtended (expired with bids)`);
      }
    }
  } catch (error) {
    logger.error("Expired services cron failed:", error);
  }
});


// =USER============================= 
const validateInputs = (data, image) => {
  const requiredFields = [
    "service", "category", "scheduleDate", "scheduleTime", "numberOfItems", "weightKG", "description", "deadlineDate", "deadlineTime",
    "isLoaderNeeded", "loadFloorNo", "loadingAddress", "loadLongitude",
    "loadLatitude", "mainService",
    "startDate", // start
    "endDate" // end
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

// ==============================================
function convertToDeadlineUTC(deadlineDate, deadlineTime, timezone) {
  try {
    // Date কে "yyyy-MM-dd" format এ আনো
    const dateStr =
      deadlineDate instanceof Date
        ? deadlineDate.toISOString().split("T")[0]
        : String(deadlineDate).split("T")[0]; // "2025-08-15"

    const combined = `${dateStr} ${deadlineTime}`; // "2025-08-15 11:30 PM"

    // 12-hour format try করো ("11:30 PM")
    let parsed = DateTime.fromFormat(combined, "yyyy-MM-dd hh:mm a", {
      zone: timezone,
    });

    // 24-hour format fallback ("23:30")
    if (!parsed.isValid) {
      parsed = DateTime.fromFormat(combined, "yyyy-MM-dd HH:mm", {
        zone: timezone,
      });
    }

    if (!parsed.isValid) {
      console.warn(`⚠️  deadline_utc parse failed: "${combined}" (${timezone})`);
      return null;
    }

    return parsed.toUTC().toJSDate(); // ← MongoDB Date object (UTC)
  } catch (err) {
    console.error("convertToDeadlineUTC error:", err.message);
    return null;
  }
}
// ============================================
const createPostDB = async (req) => {
  try {
    const { userId } = req.user;
    const { image } = req.files || {};
    const data = req.body;

    if (data?.mainService === "sell") {
      const bankAccount = await StripeAccount.findOne({ user: userId });

      if (!bankAccount || !bankAccount?.stripeAccountId || !bankAccount?.externalAccountId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Please add your bank information in your profile.");
      }

      try {
        const stripeAccount = await stripe.accounts.retrieve(bankAccount?.stripeAccountId);

        if (!stripeAccount) {
          throw new ApiError(httpStatus.BAD_REQUEST, "Unable to find or validate your bank account.");
        }

        const externalAccount = stripeAccount.external_accounts?.data?.find(
          (account) => account.id === bankAccount.externalAccountId
        );

        if (!externalAccount) {
          throw new ApiError(httpStatus.BAD_REQUEST, "Please add your bank information.");
        }

      } catch (error) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Error validating bank account: ${error.message}`);
      }
    }

    const images = validateInputs(data, image);

    const distance = Number(data.distance);
    const formattedDistance = parseFloat(distance?.toFixed(3));

    console.log("=|= data from App|=|", data.deadlineDate, data.deadlineTime, "timezone", data.timezone);
    const deadline_utc = convertToDeadlineUTC(
      data.deadlineDate,
      data.deadlineTime,
      data.timezone || "UTC"
    );

    console.log("=|= deadline_utc", deadline_utc);

    if (!deadline_utc) {
      throw new ApiError(400, "Invalid deadlineDate or deadlineTime format.");
    }

    // Validate price
    if (data.mainService === "move") {
      const tempService = {
        weightKG: Number(data.weightKG),
        loadFloorNo: data.loadFloorNo,
        unloadFloorNo: data.unloadFloorNo,
        distance: Number(data.distance)
      };
      const { minimumBed } = await VariableCount.calculateBedCosts(tempService);
      if (data.price < minimumBed) {
        throw new ApiError(400, 'Price too low for move service');
      }
    } else if (data.mainService === "sell") {
      if (data.price < data.minPrice) {
        throw new ApiError(400, 'Price cannot be less than minimum price');
      }
    }

    const serviceData = {
      user: userId,
      mainService: data.mainService,
      service: data.service,
      category: data.category,
      scheduleDate: data.scheduleDate,
      scheduleTime: data.scheduleTime,
      numberOfItems: Number(data.numberOfItems),
      weightMTS: data.weightMTS,
      weightKG: Number(data.weightKG),
      description: data.description,
      deadlineDate: data.deadlineDate,
      deadlineTime: data.deadlineTime,
      isLoaderNeeded: data.isLoaderNeeded,
      loadFloorNo: data.loadFloorNo,
      deadline_utc,
      isUnloaderNeeded: data.isUnloaderNeeded,
      unloadFloorNo: data.unloadFloorNo,
      loadingAddress: data.loadingAddress,
      unloadingAddress: data.unloadingAddress,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
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
  const { role } = req.user;

  const variable = await Variable.findOne();
  const surcharge = Number(variable?.surcharge || 0);

  const result = await Services.findById(serviceId)
    .populate({
      path: "category",
      select: "_id category category_spain",
    })
    .populate({
      path: "user",
      select: "name profile_image email",
    })
    .populate({
      path: "bids",
      populate: [
        {
          path: "partner",
          model: "Partner",
          select: "_id profile_image rating name",
        },
      ],
    })
    .populate("confirmedPartner")
    .lean();

  if (!result) {
    throw new ApiError(404, "Service not found");
  }


  if (role === ENUM_USER_ROLE.USER && result.mainService === 'move') {
    if (result.bids && Array.isArray(result.bids)) {
      result.bids = result.bids.map((bid) => ({
        ...bid,
        price: bid.price
          + (bid.price * surcharge) / 100,
      }));
    }
  }

  if (role === ENUM_USER_ROLE.USER && result.mainService === 'sell') {
    if (result.bids && Array.isArray(result.bids)) {
      result.bids = result.bids.map((bid) => ({
        ...bid,
        price: bid.price
          - (bid.price * surcharge) / 100,
      }));
    }
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
      select: "_id category category_spain",
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
  // console.log('=====', serviceId)
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
      confirmedAt: new Date(),
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

  const mainServiceTypes = result.mainService === "sell" ? "service_payment" : "service";

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
    types: mainServiceTypes,
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
  const { rescheduledReason, rescheduledTime, rescheduledDate, rescheduledDateTime } = req.body;

  if (!rescheduledDate || !rescheduledTime || !rescheduledDateTime) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Rescheduled Time and Date are required!"
    );
  }

  // console.log("rescheduledDateTime", rescheduledDateTime)

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
      rescheduledDateTime,
      rescheduledStatus: "pending",
      status: ENUM_SERVICE_STATUS.RESCHEDULED,
    },
    { new: true }
  );

  /* =========================
   🔔 Notify Partner
   ========================= */
  await NotificationService.sendNotification({
    title: {
      eng: "Service Reschedule Request",
      span: "Solicitud de Reprogramación del Servicio",
    },
    message: {
      eng: "The customer requested a new date and time. Please review and respond.",
      span: "El cliente solicitó una nueva fecha y hora. Por favor revise y responda.",
    },
    user: service?.confirmedPartner,
    userType: "Partner",
    types: "reschedule",
    getId: serviceId
  });

  return result;
};

// =PARTNER=================================
const searchNearby = async (req) => {
  const { longitude, latitude, service } = req.query;
  const { userId } = req.user;

  if (!longitude || !latitude) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing longitude or latitude");
  }

  // console.log("search nearby with longitude and latitude", longitude, latitude)

  const lng = Number(longitude);
  const lat = Number(latitude);

  if (isNaN(lng) || isNaN(lat)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid longitude or latitude");
  }
  // console.log("===", longitude, latitude)
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
        maxDistance: coverageRadius ? Number(coverageRadius * 1000) : 10000 * 1000,
        query: {
          status: ENUM_SERVICE_STATUS.PENDING,
          ...(service && { service }),
        },
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
        deadline_utc: 1,
        loadingLocation: 1,
      },
    },
  ]);

  const populatedServices = await Services.populate(nearbyServices, { path: 'category' });

  // Filter out expired services for Partners
  let filteredServices = populatedServices;
  if (req.user.role === ENUM_USER_ROLE.PARTNER) {
    const now = new Date();
    filteredServices = populatedServices.filter(service => {
      const deadline = service.deadline_utc ? new Date(service.deadline_utc) : parseDateTime(service.deadlineDate, service.deadlineTime);
      service.deadline = deadline;
      return deadline ? deadline > now : true;
    });
  }

  return {
    count: filteredServices.length,
    populatedServices: filteredServices,
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
    updateFields.startDate = service.rescheduledDateTime;
  } else if (rescheduledStatus === "decline") {
    updateFields.rescheduledStatus = ENUM_SERVICE_STATUS.DECLINED;
    updateFields.status = ENUM_SERVICE_STATUS.ACCEPTED;
  }

  // console.log(" updateFields.startDate", updateFields.startDate, serviceId)

  await NotificationService.sendNotification({
    title: {
      eng: rescheduledStatus === "accepted" ? "Reschedule Request Accepted" : "Reschedule Request Declined",
      span: rescheduledStatus === "accepted" ? "Solicitud de Reprogramación Aceptada" : "Solicitud de Reprogramación Rechazada"
    },
    message: {
      eng: `The reschedule request for service has been ${rescheduledStatus}.`,
      span: `La solicitud de reprogramación para el servicio ha sido ${rescheduledStatus}.`,
    },
    user: service?.confirmedPartner,
    userType: "Partner",
    types: "reschedule",
    getId: serviceId,
  });

  const result = await Services.findOneAndUpdate(
    { _id: serviceId },
    updateFields,
    { new: true }
  );

  return result;
};

const getUserServicesWithinOneHour = async (req) => {
  const { userId, role } = req.user;
  const dateNow = new Date(req.query?.current_date);
  const oneHourLater = new Date(dateNow.getTime() + 60 * 60 * 1000);

  const query = {
    status: { $in: ["accepted", "pick-up", "in-progress"] },
    paymentStatus: "paid",
    startDate: {
      $lte: oneHourLater,
    },
  };

  if (role === ENUM_USER_ROLE.USER) {
    query.user = userId;
  } else if (role === ENUM_USER_ROLE.PARTNER) {
    query.confirmedPartner = userId;
  }

  // Fetch services and surcharge in parallel (if needed)
  // .select() excludes heavy fields to improve transfer speed and reduce memory usage
  // .lean() returns plain JS objects which are faster to process
  const [servicesResult, surcharge] = await Promise.all([
    Services.find(query)
      .sort({ createdAt: -1 })
      .select("-image -description -goodsLoadedImages -deliveredImages -unloadingAddress -transactionId -rescheduledReason")
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
        select: "_id category category_spain",
      })
      .lean(),
    role === ENUM_USER_ROLE.USER ? getSurcharge() : Promise.resolve(0),
  ]);

  if (role === ENUM_USER_ROLE.USER) {
    return servicesResult.map((data) => ({
      ...data,
      winBid: data.mainService === 'move'
        ? Number(data.winBid) + (Number(data.winBid) * surcharge) / 100 
        : Number(data.winBid) - (Number(data.winBid) * surcharge) / 100,
    }));
  }

  return servicesResult;
};


const filterUserByHistory = async (req) => {
  const { categories, serviceType, serviceStatus } = req.query;
  const { userId, role } = req.user;
  let service;

  const variable = await Variable.findOne();
  const surcharge = Number(variable?.surcharge || 0);

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
        select: "_id category category_spain",
      }),
    query
  )
    .sort()
    .paginate();

  if (serviceStatus === "completed") {
    filtered
  }
  // filtered.modelQuery = filtered.modelQuery.populate({    

  let result = await filtered.modelQuery;
  const meta = await filtered.countTotal();

  // console.log('result', result)

  if (role === ENUM_USER_ROLE.USER && serviceType === "move" && serviceStatus === "accepted") {
    result = result.map((data) => ({
      ...data._doc,
      winBid: data.winBid ? Number(data.winBid)
        + (Number(data.winBid) * surcharge) / 100
        : null,
    }));
  }

  if (role === ENUM_USER_ROLE.USER && serviceType === "sell" && serviceStatus === "accepted") {
    result = result.map((data) => ({
      ...data._doc,
      winBid: data.winBid ? Number(data.winBid)
        - (Number(data.winBid) * surcharge) / 100
        : null,
    }));
  }
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

  console.log("service======", service.user_status, status)

  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service with the given ID not found.");
  }

  if (!Object.values(ENUM_SERVICE_STATUS).includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status provided.");
  }

  if (status === "arrived" && service.status !== "accepted") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User must confirm the pending request before the partner can arrive."
    );
  }

  if (status === "goods_loaded" && service.user_status !== "confirm_arrived") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User must confirm the partner has arrived before goods can be loaded."
    );
  }

  if (status === "arrived_destination" && service.user_status !== "confirm_goods_loaded") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Goods must be loaded and the trip must be started before arriving at the destination."
    );
  }

  if (status === "downloaded" && service.user_status !== "confirm_arrived_destination") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You must arrive at the destination before downloading the goods."
    );
  }

  if (status === "delivered" && service.user_status !== "confirm_downloaded") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User must confirm the partner has reached the destination before marking as delivered."
    );
  }

  // arrived
  // goods_loaded
  // downloaded
  // delivery

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
    title: {
      eng: "Service Status Updated",
      span: "Estado del Servicio Actualizado"
    },
    message: {
      eng: `The service status has been updated to "${status}".`,
      span: `El estado del servicio ha sido actualizado a "${status}".`
    },

    user: service.user,
    userType: "User",
    types: "ongoing",
    getId: serviceId,
  });

  console.log("serviceId, status, userType", serviceId, status, "partner")

  await sendUpdateStatus(serviceId, status, "user");

  return result;
};

const updateServicesStatusUser = async (req) => {
  const { serviceId, status } = req.query;

  if (!serviceId || !status) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Service ID and status are required in the query parameters.");
  }

  const service = await Services.findById(serviceId);

  console.log("service======", service.partner_status, status)

  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service not found.");
  }

  if (service.paymentStatus !== "paid") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Payment must be completed before you can update the status.");
  }

  if (!Object.values(ENUM_SERVICE_STATUS).includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status provided.");
  }

  try {
    const transaction = await Transaction.findOne({ serviceId, active: true });
    if (!transaction || transaction.paymentStatus !== "Completed") {
      throw new ApiError(httpStatus.BAD_REQUEST, "Payment is not completed.");
    }

    const receivedUser =
      transaction.receiveUserType === "Partner"
        ? await Partner.findById(transaction.receiveUser)
        : await User.findById(transaction.receiveUser);

    if (!receivedUser) {
      throw new ApiError(httpStatus.NOT_FOUND, "Recipient user not found for the transaction.");
    }

    if (status === "confirm_arrived" && service.partner_status !== "arrived") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Partner must mark status as 'arrived' before the user can confirm arrival."
      );
    }

    if (status === "confirm_goods_loaded" && service.partner_status !== "goods_loaded") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Partner must mark goods as loaded before the user can confirm it."
      );
    }

    if (status === "confirm_arrived_destination" && service.partner_status !== "arrived_destination") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Partner must mark status as 'arrived destination' before the user can confirm arrival at the destination."
      );
    }

    if (status === "confirm_downloaded" && service.partner_status !== "downloaded") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Partner must mark status as 'downloaded' before the user can confirm arrival at the destination."
      );
    }

    if (status === "delivery-confirmed" && service.partner_status !== "delivered") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Partner must mark status as 'delivered' before the user can confirm delivery."
      );
    }

    if (status === "delivery-confirmed") {
      const amount = Number(transaction.partnerAmount);
      receivedUser.wallet = (receivedUser.wallet || 0) + amount;
      await receivedUser.save();

      const bankAccount = await StripeAccount.findOne({ user: transaction.receiveUser });

      if (!bankAccount || !bankAccount?.stripeAccountId || !bankAccount?.externalAccountId) {
        throw new ApiError(400, "Invalid bank account data provided!");
      }

      try {
        const stripeAccount = await stripe.accounts.retrieve(bankAccount?.stripeAccountId);

        if (!stripeAccount) {
          throw new ApiError(httpStatus.BAD_REQUEST, "Payment Receive Back Account Not Found.");
        }

        if (!stripeAccount.capabilities?.transfers || stripeAccount.capabilities.transfers !== "active") {
          throw new ApiError(httpStatus.BAD_REQUEST, "Payment Receive Back Account Unverified");
        }

        const externalAccount = stripeAccount.external_accounts?.data?.find(
          (account) => account.id === bankAccount.externalAccountId
        );

        if (!externalAccount) {
          throw new ApiError(httpStatus.BAD_REQUEST, "Payment Receive Back Account Not Found.");
        }

      } catch (error) {

        throw new ApiError(httpStatus.BAD_REQUEST, `Error validating bank account: ${error.message}`);
      }

      // Convert USD to MXN for the payout
      const { pesoCost } = await VariableCount.convertDollarToPeso(amount);
      const transfer = await stripe.transfers.create({
        amount: Math.round(pesoCost * 100),
        currency: 'mxn',
        destination: bankAccount?.stripeAccountId,
      });

      // Perform the payout in MXN
      const payout = await stripe.payouts.create(
        {
          amount: Math.round(pesoCost * 100),
          currency: 'mxn',
        },
        {
          stripeAccount: bankAccount?.stripeAccountId,
        }
      );

      // console.log("Payout successful:", payout);

      transaction.isFinish = true;
      await transaction.save();

      await NotificationService.sendNotification({
        title: {
          eng: "Payment Received",
          span: "Pago Recibido"
        },
        message: {
          eng: `You’ve received a payment. Funds have been transferred to your bank account ending in ${bankAccount?.stripeAccountId.slice(-4)}.`,
          span: `Has recibido un pago. Los fondos han sido transferidos a tu cuenta bancaria que termina en ${bankAccount?.stripeAccountId.slice(-4)}.`
        },
        user: receivedUser._id,
        userType: transaction.receiveUserType,
        types: "complete-status",
        getId: serviceId,
      });
    }

    let serviceStatus = service.status;
    if (status === "goods_loaded") {
      serviceStatus = "pick-up";
    } else if (status === "delivery-confirmed") {
      serviceStatus = "completed";
    }
    // confirm_arrived
    // confirm_goods_loaded
    // confirm_downloaded
    // delivery-confirmed

    const updatedService = await Services.findByIdAndUpdate(
      serviceId,
      { user_status: status, status: serviceStatus },
      { new: true }
    );

    await NotificationService.sendNotification({
      title: {
        eng: "Service Status Updated",
        span: "Estado del Servicio Actualizado"
      },
      message: {
        eng: `The service status has been updated to "${status}".`,
        span: `El estado del servicio ha sido actualizado a "${status}".`
      },
      user: service.confirmedPartner,
      userType: "Partner",
      types: serviceStatus === "completed" ? "complete-status" : "ongoing",
      getId: serviceId,
    });

    await sendUpdateStatus(serviceId, status, "partner");

    return updatedService;
  } catch (error) {
    console.log(error)
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error updating service status: ${error.message}`);
  }
};

//---------------
const updateSellServicesStatusUser = async (req) => {
  const { serviceId, status } = req.query;

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
    throw new ApiError(httpStatus.BAD_REQUEST, "Partner must arrive and user must confirm arrival before delivery.");
  }

  const transaction = await Transaction.findOne({ serviceId, active: true });
  if (!transaction || transaction.paymentStatus !== "Completed") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Payment is not completed.");
  }

  try {
    const receivedUser =
      transaction.receiveUserType === "Partner"
        ? await Partner.findById(transaction.receiveUser)
        : await User.findById(transaction.receiveUser);

    if (!receivedUser) {
      throw new ApiError(httpStatus.NOT_FOUND, "Recipient user not found for the transaction.");
    }

    const updatedService = await Services.findByIdAndUpdate(
      serviceId,
      { user_status: status },
      { new: true }
    );

    await NotificationService.sendNotification({
      title: {
        eng: "Service Status Updated",
        span: "Estado del Servicio Actualizado"
      },
      message: {
        eng: `The service status has been updated to "${status}".`,
        span: `El estado del servicio ha sido actualizado a "${status}".`
      },
      user: service.confirmedPartner,
      userType: "Partner",
      types: "service",
      getId: serviceId,
    });

    await sendUpdateStatus(serviceId, status, "partner");

    return updatedService;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error updating service status: ${error.message}`);
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
    { serviceId, active: true },
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

  try {
    if (status === "delivery-confirmed") {
      const amount = Number(transaction.partnerAmount);
      // console.log("===========amount", amount)
      receivedUser.wallet = (receivedUser.wallet || 0) + amount;
      await receivedUser.save();

      const bankAccount = await StripeAccount.findOne({ user: transaction.receiveUser });

      if (!bankAccount || !bankAccount?.stripeAccountId || !bankAccount?.externalAccountId) {
        throw new ApiError(400, "Invalid bank account data provided!");
      }

      try {
        const stripeAccount = await stripe.accounts.retrieve(bankAccount?.stripeAccountId);

        if (!stripeAccount) {
          throw new ApiError(httpStatus.BAD_REQUEST, "Payment Receive Back Account Not Found.");
        }

        if (!stripeAccount.capabilities?.transfers || stripeAccount.capabilities.transfers !== "active") {
          throw new ApiError(httpStatus.BAD_REQUEST, "Payment Receive Back Account Unverified");
        }

        const externalAccount = stripeAccount.external_accounts?.data?.find(
          (account) => account.id === bankAccount.externalAccountId
        );

        if (!externalAccount) {
          throw new ApiError(httpStatus.BAD_REQUEST, "Payment Receive Back Account Not Found.");
        }

      } catch (error) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Error validating bank account: ${error.message}`);
      }

      // Convert USD to MXN for the payout
      const { pesoCost } = await VariableCount.convertDollarToPeso(amount);
      const transfer = await stripe.transfers.create({
        amount: Math.round(pesoCost * 100),
        currency: 'mxn',
        destination: bankAccount?.stripeAccountId,
      });

      // Perform the payout in MXN
      const payout = await stripe.payouts.create(
        {
          amount: Math.round(pesoCost * 100),
          currency: 'mxn',
        },
        {
          stripeAccount: bankAccount?.stripeAccountId,
        }
      );

      transaction.isFinish = true;
      await transaction.save();

      await NotificationService.sendNotification({
        title: {
          eng: "Payment Received",
          span: "Pago Recibido"
        },
        message: {
          eng: `You’ve received a payment. Funds have been transferred to your bank account ending in ${bankAccount?.stripeAccountId.slice(-4)}.`,
          span: `Has recibido un pago. Los fondos han sido transferidos a tu cuenta bancaria que termina en ${bankAccount?.stripeAccountId.slice(-4)}.`
        },
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
      { new: true }
    );

    await NotificationService.sendNotification({
      title: {
        eng: "Service Status Updated",
        span: "Estado del Servicio Actualizado"
      },
      message: {
        eng: `The service status has been updated to "${status}".`,
        span: `El estado del servicio ha sido actualizado a "${status}".`
      },
      user: service.user,
      userType: "User",
      types: "service",
      getId: serviceId,
    });

    await sendUpdateStatus(serviceId, status, "user");

    return result;
  } catch (error) {
    console.error("Error updating service status:", error);
    throw error;
  }
};

const uploadStatusImage = async (req) => {
  const { serviceId, status } = req.body;

  // console.log("===serviceId,status", serviceId, status)

  if (status !== "goods_loaded" && status !== "delivered") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid status. Only 'goods_loaded' and 'delivered' are allowed."
    );
  }

  if (!serviceId || !status) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "serviceId and status are required"
    );
  }

  const service = await Services.findById(serviceId);

  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service not found");
  }

  // =============================
  // GOODS LOADED
  // =============================
  if (status === "goods_loaded") {
    if (!req.files?.goodsLoadedImages) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Goods loaded images are required"
      );
    }

    service.goodsLoadedImages = req.files.goodsLoadedImages.map(
      (file) => file.path
    );
    service.partner_status = "goods_loaded";
  }

  // =============================
  // DELIVERED
  // =============================
  if (status === "delivered") {
    if (!req.files?.deliveredImages) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Delivered images are required"
      );
    }

    service.deliveredImages = req.files.deliveredImages.map(
      (file) => file.path
    );

    service.partner_status = "delivered";
  }

  await service.save();

  await sendUpdateStatus(serviceId, status, "partner");

  return service;
};

// Status===========================
const sendUpdateStatus = (serviceId, status, userType) => {
  console.log("1")
  if (global.io) {
    console.log("2 Emitting socket event for service status update");
    const socketIo = global.io;
    socketIo.emit(`${ENUM_SOCKET_EVENT.UPDATE_LOCATIONS_STATUS}/${serviceId}`, {
      serviceId,
      status,
      userType
    });
    console.log("3", `${ENUM_SOCKET_EVENT.UPDATE_LOCATIONS_STATUS}/${serviceId}`);
  } else {
    console.error('Socket.IO is not initialized');
  }
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
  updateSellServicesStatusUser,
  updateSellServicesStatusPartner,
  uploadStatusImage
};

module.exports = { ServicesService };

