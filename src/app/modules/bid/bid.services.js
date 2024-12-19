const { default: mongoose } = require("mongoose");
const ApiError = require("../../../errors/ApiError");
const Partner = require("../partner/partner.model");
const Services = require("../services/services.model");
const VariableCount = require("../variable/variable.count");
const calculateBedCosts = require("../variable/variable.count");
const { Review, Bids, FileClaim } = require("./bid.model");
const { Transaction } = require("../payment/payment.model");
const User = require("../user/user.model");
const { NotificationService } = require("../notification/notification.service");
const QueryBuilder = require("../../../builder/queryBuilder");
const httpStatus = require("http-status");
const { LogsDashboardService } = require("../logs-dashboard/logsdashboard.service");
// const Bids = require("./bid.model");

const partnerBidPost = async (req) => {
  const { serviceId } = req.params;
  const { userId } = req.user;
  const { price } = req.body;

  if (!price || isNaN(price)) {
    throw new ApiError(400, "Price must be a valid number");
  }


  const foundService = await Services.findById(serviceId);

  if (!foundService) {
    throw new ApiError(404, "Service not found");
  }

  const { minimumBed, maximumBed } = await VariableCount.calculateBedCosts(foundService)

  if (price < minimumBed || price > maximumBed) {
    throw new ApiError(
      400,
      `Price must be greater than or equal to ${minimumBed} and less than or equal to ${maximumBed}`
    );
  }


  const existingBid = await Bids.findOne({
    service: serviceId,
    partner: userId,
  });

  const data = {
    service: serviceId,
    partner: userId,
    status: "Pending",
    price,
    serviceType: foundService.service,
  };

  const bitData = await Bids.findOne({ service: serviceId }).sort({
    price: -1,
  });

  let updateService;
  let updatedBid;
  let updatePrice = foundService?.bestBid;

  if (bitData && (bitData.price < price || foundService.bestBid < price)) {
    updatePrice = price;
  }

  if (existingBid) {
    updatedBid = await Bids.findByIdAndUpdate(
      existingBid._id,
      {
        price,
        status: "Pending",
      },
      { new: true }
    );

    if (bitData?.price < price || foundService?.bestBid < price) {
      updatePrice = price;
    }
  } else {
    updatedBid = await Bids.create(data);
    updateService = await Services.findByIdAndUpdate(
      serviceId,
      {
        $push: { bids: updatedBid._id },
        bestBid: updatePrice,
      },
      { new: true }
    );
  }

  await NotificationService.sendNotification({
    title: "New Bid Received",
    message: `You have placed a new bid of $${price} for your service.`,
    user: foundService.user,
    userType: 'User',
    getId: serviceId,
    types: 'service',
  });

  return {
    service: updateService,
    bids: updatedBid,
  };
};

const getBitProfilePartner = async (req) => {
  const { bidId } = req.query;

  const bids = await Bids.findById(bidId).populate("partner")
    .populate({ path: "service", select: "mainService" });
  if (!bids) {
    throw new ApiError(404, "Bids not found!");
  }
  const partnerId = bids.partner._id
  const all_review = await Review.find({ partnerId })
    .populate({
      path: 'userId',
      select: 'name email profile_image'
    })
  const pisoVariable = await VariableCount.getPisoVariable();
  return { bids, all_review, piso: pisoVariable };
};

const partnerAllBids = async (req) => {
  const { userId } = req.user;

  const result = await Bids.find({ partner: userId }).populate("service");
  // .populate('partner');

  if (!result || result.length === 0) {
    throw new ApiError(404, "Bids not found yet");
  }

  return result;
};

const filterBidsByMove = async (req) => {
  const { categories, serviceType } = req.query;
  const { userId } = req.user;

  if (!serviceType) {
    throw new ApiError(400, "Please provide serviceType");
  }

  const filteredBids = await Bids.find({ partner: userId, status: "Pending" })
    .populate({
      path: "service",
      match: {
        service: serviceType || { $exists: true },
        category: categories ? { $in: categories } : { $exists: true },
      },
    })
    .exec();

  return filteredBids.filter((bid) => bid.service !== null);
};

const filterBidsByHistory = async (req) => {
  const { categories, serviceStatus, bitStatus, page = 1, limit = 10 } = req.query;
  const { serviceType } = req.body;
  const { userId } = req.user;

  const skip = (page - 1) * limit;

  try {
    const bidQuery = {
      partner: userId,
      status: bitStatus || { $in: ["Win", "Outbid", "Pending"] },
    };

    const totalBids = await Bids.countDocuments(bidQuery);

    const serviceQuery = {
      ...(serviceType && { service: serviceType }),
      ...(categories && { category: { $in: categories } }),
      ...(serviceStatus && { status: serviceStatus }),
    };

    const filteredBids = await Bids.find(bidQuery)
      .populate({
        path: "partner",
        select: "_id name profile_image email rating",
      })
      .populate({
        path: "service",
        match: serviceQuery,
        // select: "_id name status",  
        populate: [
          { path: "user", select: "_id name profile_image email" },
          { path: "category", select: "_id category" },
        ],
      })
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    const result = filteredBids.filter((bid) => bid.service);

    const pisoVariable = await VariableCount.getPisoVariable();

    return {
      piso: pisoVariable,
      page: parseInt(page),
      totalPage: Math.ceil(totalBids / limit),
      limit: parseInt(limit),
      result,
    };
  } catch (error) {
    console.error("Error in filterBidsByHistory:", error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "An error occurred while filtering bids.");
  }
};

// ================================
const orderDetailsPageFileClaim = async (req) => {
  const { serviceId } = req.query;
  const service = await Services.findById(serviceId)
    .populate({
      path: 'user',
      select: 'name profile_image email'
    })
    .populate({
      path: 'confirmedPartner',
      select: 'name profile_image email rating'
    })
    .populate({
      path: 'category',
      select: '_id category'
    })
  // .select('_id category numberOfItems scheduleTime scheduleTime scheduleDate loadingAddress deadlineTime loadingLocation paymentStatus deadlineDate unloadingAddress unloadingLocation updatedAt image winBid deadlineTime')
  const payment = await Transaction.findOne({ serviceId }).select('amount paymentMethod',)
  return { service, payment }
}

// ===============================
// Review
// ===============================
const postReviewMove = async (req) => {
  const { serviceId, partnerId } = req.query;
  const { userId } = req.user;
  const { comment, rating } = req.body;

  if (!comment || typeof comment !== 'string' || comment.trim() === '') {
    throw new ApiError(400, "Comment is required and must be a non-empty string.");
  }

  if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be a number between 1 and 5.");
  }

  if (!partnerId || !mongoose.isValidObjectId(partnerId)) {
    throw new ApiError(400, "Invalid partner ID.");
  }

  if (!mongoose.isValidObjectId(serviceId)) {
    throw new ApiError(400, "Invalid service ID.");
  }

  const service = await Services.findById(serviceId);
  if (!service) {
    throw new ApiError(404, "Service not found.");
  }

  const partner = await Partner.findById(partnerId);
  if (!partner) {
    throw new ApiError(404, "Partner not found.");
  }

  // if (service.isReviewed) {
  //   throw new ApiError(400, "You have already reviewed this service.");
  // }

  const result = await Review.create({
    comment: comment.trim(),
    rating,
    partnerId,
    userId,
    serviceId,
  });

  const reviews = await Review.find({ partnerId });
  const totalRating = reviews?.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0)
    : 0;

  const averageRating = reviews.length
    ? Math.round(totalRating / reviews.length)
    : 0;

  await Partner.findByIdAndUpdate(partnerId, {
    rating: averageRating
  });

  service.isReviewed = true;
  await service.save();

  return result;
};

const getPartnerReviews = async (req) => {
  const { partnerId } = req.query;
  const result = await Review.find({ partnerId })
    .populate({
      path: 'userId',
      select: 'name email profile_image'
    })
  return result
}

// =File Claim============================
const createFileClaim = async (req, res) => {
  const { serviceId } = req.query;
  const { userId, role } = req.user;
  const { description } = req.body;
  const { fileClaimImage } = req.files || {};

  const service = await Services.findById(serviceId)
  if (!service) {
    throw new ApiError(404, "Service not found.");
  }

  let images = [];
  if (fileClaimImage && Array.isArray(fileClaimImage)) {
    images = fileClaimImage.map(file => `/images/file-claim/${file.filename}`);
  }

  let user;
  if (role === "USER") {
    user = await User.findById(userId)
  } else if (role === "PARTNER") {
    user = await Partner.findById(userId)
  } else {
    throw new ApiError(403, "Unauthorized to perform this action.");
  }

  const result = await FileClaim.create({
    fileClaimImage: images ? images : '',
    user: userId,
    name: user.name,
    orderId: serviceId,
    serviceId,
    description,
    userType: role === "USER" ? "User" : "Partner"
  })

  return result;
}

const updateStatusFileClaim = async (req, res) => {
  const { claimId, status } = req.body;
  const { userId, emailAuth } = req.user;

  if (!claimId || !mongoose.isValidObjectId(claimId)) {
    throw new ApiError(400, "Invalid or missing claimId.");
  }

  const allowedStatuses = ["pending", "in-progress", "resolved"];
  if (!status || !allowedStatuses.includes(status)) {
    throw new ApiError(400, `Invalid or missing status. Allowed values: ${allowedStatuses.join(", ")}`);
  }

  try { 
    const result = await FileClaim.findByIdAndUpdate(
      claimId,
      { status },
      { new: true }
    );

    if (!result) {
      throw new ApiError(404, "File claim not found.");
    }
 
    if (status === "resolved") {
      await NotificationService.sendNotification({
        title: "File Claim Resolved.",
        message: `Your claim against ${result?.userType === "User" ? 'partner' : 'user'} has been resolved.`,
        user: result.user,
        userType: result.userType,
        types: 'none',
      });
    }

    // Log success
    const newTask = {
      admin: userId,
      email: emailAuth,
      description: `File claim with ID ${claimId} successfully updated to status '${status}'.`,
      types: "Update",
      activity: status === "resolved"? "task":"progressing",
      status: "Success",
      attended:"complaints"
    };
    await LogsDashboardService.createTaskDB(newTask);

    return result;
  } catch (error) {
    // Log failure
    const newTask = {
      admin: userId,
      email: emailAuth,
      description: `Failed to update file claim with ID ${claimId}: ${error.message || "Unknown error"}.`,
      types: "Failed",
      activity: status === "resolved"? "task":"progressing",
      status: "Error",
    };
    await LogsDashboardService.createTaskDB(newTask);

    throw new ApiError(
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "An error occurred while updating the file claim status."
    );
  }
};


const getAllFileClaims = async (req, res) => {
  try {
    const query = req.query;
    console.log("Query received:", query);

    const resultQuery = new QueryBuilder(
      FileClaim.find()
        .populate({
          path: "serviceId",
          populate: [
            { path: "user", select: "_id name email profile_image" },
            { path: "confirmedPartner", select: "_id name email profile_image" },
          ],
        })
        .populate({
          path: "user",
          select: "name email profile_image",
        }),
      query
    )
      .search(["orderId", "name", "status"])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await resultQuery.modelQuery;
    const meta = await resultQuery.countTotal();

    return {
      success: true,
      data: result,
      meta,
    };
  } catch (error) {
    console.error("Error fetching file claims:", error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "An error occurred while fetching file claims.");
  }
}

//cut-amount---
const applyPenaltyPercent = async (req, res) => {
  const { serviceId, amountPercent, reason, id } = req.body;

  if (!serviceId || !mongoose.isValidObjectId(serviceId)) {
    throw new ApiError(400, "Invalid or missing serviceId.");
  }

  const percentValue = parseFloat(amountPercent);
  if (isNaN(percentValue) || percentValue <= 0) {
    throw new ApiError(400, "Invalid or missing cut amount.");
  }

  const service = await Services.findById(serviceId);
  if (!service) {
    throw new ApiError(404, "Service not found.");
  }

  const transaction = await Transaction.findOne({ serviceId });
  if (!transaction) {
    throw new ApiError(404, "No transactions found for this service.");
  }

  const { amount } = transaction;
  const cutAmount = Number(amount) - (Number(amount) * (percentValue / 100))

  transaction.amount = cutAmount;
  transaction.payType = 'fine';
  transaction.finePercent = percentValue;
  transaction.fineReason = reason;

  if (service.mainService === "sell") {
    const user = await User.findById(service.user);
    if (!user || user.wallet === undefined) {
      throw new ApiError(404, "User not found or wallet not initialized.");
    }
    user.wallet -= cutAmount;
    await user.save();
    await NotificationService.sendNotification({
      title: "Penalty Applied",
      message: `A penalty of ${percentValue}% (${reason}) has been deducted from your wallet.`,
      user: user._id,
      userType: 'User',
      types: 'none',
    });

  } else if (service.mainService === "move") {
    const partner = await Partner.findById(service.confirmedPartner);
    if (!partner || partner.wallet === undefined) {
      throw new ApiError(404, "Partner not found or wallet not initialized.");
    }
    partner.wallet -= cutAmount;
    await partner.save();
    await NotificationService.sendNotification({
      title: "Penalty Applied",
      message: `A penalty of ${percentValue}% (${reason}) has been deducted from your wallet.`,
      user: partner._id,
      userType: 'Partner',
      types: 'none',
    });
  }
  await transaction.save();

  await FileClaim.findById(id, {
    $set: { status: 'pending' }
  })



  return { service, transaction };
};

const statusServicesDetails = async (req, res) => {
  const { serviceId } = req.query;
  if (!serviceId) {
    throw new ApiError(400, "Service ID is required.");
  }


  const service = await Services.findById(serviceId)
    .populate({
      path: 'user',
      select: 'name email profile_image'
    })
    .populate({
      path: 'confirmedPartner',
      select: 'name email profile_image rating'
    })
    .populate({
      path: 'category',
      select: '_id category'
    })


  return service;
};


const BidService = {
  partnerBidPost,
  partnerAllBids,
  filterBidsByMove,
  filterBidsByHistory,
  postReviewMove,
  getPartnerReviews,
  getBitProfilePartner,
  orderDetailsPageFileClaim,
  // orderServicesMapDetails
  createFileClaim,
  updateStatusFileClaim,
  applyPenaltyPercent,
  statusServicesDetails,
  getAllFileClaims
};

module.exports = { BidService };
