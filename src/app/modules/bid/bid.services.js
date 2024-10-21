const ApiError = require("../../../errors/ApiError");
const Services = require("../services/services.model");
const Bids = require("./bid.model");

const partnerBidPost = async (req) => {
  const { serviceId } = req.params;
  const { userId } = req.user;
  const { price } = req.body;

  if (!price || isNaN(price)) {
    throw new ApiError(400, "Price must be a valid number");
  }

  const foundService = await Services.findById(serviceId);
  if (price > foundService.maxPrice || price < foundService.minPrice) {
    throw new ApiError(400, "Price must less than maxPrice and more");
  }

  if (!foundService) {
    throw new ApiError(404, "Service not found");
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

  return {
    service: updateService,
    bids: updatedBid,
  };
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
  const { categories, serviceType, bitStatus } = req.query;
  const { userId } = req.user;
  const filteredBids = await Bids.find({
    partner: userId,
    status: bitStatus ? bitStatus : ["Win", "Outbid"],
  })
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

const BidService = {
  partnerBidPost,
  partnerAllBids,
  filterBidsByMove,
  filterBidsByHistory,
};

module.exports = { BidService };
