const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const { BidService } = require("./bid.services");


const partnerBidPost = catchAsync(async (req, res) => {

  const result = await BidService.partnerBidPost(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bids successfully",
    data: result,
  });
});


const partnerAllBids = catchAsync(async (req, res) => {

  const result = await BidService.partnerAllBids(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All bids get successfully",
    data: result,
  });
});

const filterBidsByMove = catchAsync(async (req, res) => {

  const result = await BidService.filterBidsByMove(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Get successfully",
    data: result,
  });
});


const filterBidsByHistory = catchAsync(async (req, res) => {

  const result = await BidService.filterBidsByHistory(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Get successfully",
    data: result,
  });
});

 


const BidController = {
  partnerBidPost,
  partnerAllBids,
  filterBidsByMove,
  filterBidsByHistory
};

module.exports = { BidController };