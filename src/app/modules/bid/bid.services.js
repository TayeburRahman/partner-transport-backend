const ApiError = require("../../../errors/ApiError");
const Services = require("../services/services.model");
const VariableCount = require("../variable/variable.count");
const calculateBedCosts  = require("../variable/variable.count");
const Bids = require("./bid.model");

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
  const { categories, rescheduled, bitStatus, page = 1, limit = 10 } = req.query;
  const { serviceType } = req.body;
  const { userId } = req.user; 
  
  const skip = (page - 1) * limit;

  console.log("hello", rescheduled, categories);
 
  const totalBids = await Bids.countDocuments({
    partner: userId,
    status: bitStatus ? bitStatus : { $in: ["Win", "Outbid", "Pending"] },  // Fix status filter here
  });

  // Find the bids with population of the service
  const filteredBids = await Bids.find({
    partner: userId,
    status: bitStatus ? bitStatus : { $in: ["Win", "Outbid", "Pending"] },
  })
    .populate({
      path: "service",
      match: {
        service: serviceType || { $exists: true },
        category: categories ? { $in: categories } : { $exists: true },
        status: rescheduled ? rescheduled : { $exists: true },  // Check service.status
      },
    })
    .skip(skip) 
    .limit(parseInt(limit)) 
    .exec();

  // Filter out bids with null service
  const result = filteredBids.filter((bid) => bid.service !== null);

  return {
    page: parseInt(page),
    totalPage: Math.ceil(totalBids / limit), // Calculate the total number of pages
    limit: limit,
    result,
  };
};


const BidService = {
  partnerBidPost,
  partnerAllBids,
  filterBidsByMove,
  filterBidsByHistory,
};

module.exports = { BidService };
