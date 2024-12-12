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
  //  console.log("llllllllllllll", minimumBed, maximumBed)
  if (price < minimumBed) {
    throw new ApiError(400, `Price must be greater than or equal to ${minimumBed}`);
  }

  if (price > maximumBed) {
    throw new ApiError(400, `Price must be less than or equal to ${maximumBed}`);
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
    user: userId, 
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

  return { bids, all_review };
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

  console.log("categories", categories);

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

  console.log("Filtering", categories, serviceStatus, bitStatus, page)

  const skip = (page - 1) * limit;

  const totalBids = await Bids.countDocuments({
    partner: userId,
    status: bitStatus ? bitStatus : { $in: ["Win", "Outbid", "Pending"] },
  });

  const filteredBids = await Bids.find({
    partner: userId,
    status: bitStatus ? bitStatus : { $in: ["Win", "Outbid", "Pending"] },
  })
    .populate({
      path: "partner",
      select: '_id name profile_image email',
    })
    .populate({
      populate: ({
        path: "user",
        select: '_id name profile_image email',
      }),
      path: "service",
      match: {
        service: serviceType || { $exists: true },
        category: categories ? { $in: categories } : { $exists: true },
        status: serviceStatus ? serviceStatus : { $exists: true },
      },
    })
    .skip(skip)
    .limit(parseInt(limit))
    .exec();

  const result = filteredBids.filter((bid) => bid.service !== null);

  return {
    page: parseInt(page),
    totalPage: Math.ceil(totalBids / limit),
    limit: limit,
    result,
  };
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
      select: 'name profile_image email'
    })
    .select('_id category numberOfItems scheduleTime scheduleTime scheduleDate loadingAddress deadlineTime loadingLocation paymentStatus deadlineDate unloadingAddress unloadingLocation updatedAt image winBid deadlineTime')
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
  console.log("update", reviews)
  const totalRating = reviews?.length ? reviews?.reduce((sum, review) => sum + review.rating, 0) : 0;
  const averageRating = totalRating / reviews.length;


  await Partner.findByIdAndUpdate(partnerId, {
    rating: averageRating
  })
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

  const result = await FileClaim.create({
    fileClaimImage: images ? images.path : '',
    user: userId,
    serviceId,
    description,
    userType: role === "USER" ? "User" : "Partner"
  })

  return result;
}

const updateStatusFileClaim = async (req, res) => {
  const { claimId, status } = req.query;

  if (!claimId || !mongoose.isValidObjectId(claimId)) {
    throw new ApiError(400, "Invalid or missing claimId.");
  }

  const allowedStatuses = ["pending", "in-progress", "resolved"];
  if (!status || !allowedStatuses.includes(status)) {
    throw new ApiError(400, `Invalid or missing status. Allowed values: ${allowedStatuses.join(", ")}`);
  }

  const result = await FileClaim.findByIdAndUpdate(
    claimId,
    { status },
    { new: true }
  );

  if (!result) {
    throw new ApiError(404, "File claim not found.");
  }

  if(status === "resolved") {
    await NotificationService.sendNotification({ 
      title: "File Claim Resolved.", 
      message: `Your claim against ${result?.userType === "User"? 'partner':'user'} has been resolved.`, 
      user: result.user, 
      userType: result.userType,  
      types: 'none',
    });
  }

  return result;
};

//cut-amount---
const applyPenaltyPercent = async (req, res) => {
  const { serviceId, amountPercent, reason } = req.query;

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
  statusServicesDetails
};

module.exports = { BidService };
