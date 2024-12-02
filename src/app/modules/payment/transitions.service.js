const QueryBuilder = require("../../../builder/queryBuilder");
const { Transaction } = require("./payment.model");

  const transitionsHistoryUser =async(req, res) => {
    const {userId, authId} = req.user;
    const query = req.query; 
    const transaction = new QueryBuilder(
        Transaction.find({userId: userId, isServiceFinish: true})
        .populate({
            path: "partnerId",
            select: "name email profile_image phone_number"
        })
        .populate({
            path: "userId",
            select: "name email profile_image phone_number"
        }),
        query
      )
        .search([])
        .filter()
        .sort()
        .paginate()
        .fields();
    
      const result = await transaction.modelQuery;
      const meta = await transaction.countTotal(); 
    return {result, meta}
  }

  const transitionsHistoryPartner =async(req, res) => {
    const {userId, authId} = req.user;
    const query = req.query; 
    const transaction = new QueryBuilder(
        Transaction.find({partnerId: userId, isServiceFinish: true})
        .populate({
            path: "partnerId",
            select: "name email profile_image phone_number"
        })
        .populate({
            path: "userId",
            select: "name email profile_image phone_number"
        }),
        query
      )
        .search([])
        .filter()
        .sort()
        .paginate()
        .fields();
    
      const result = await transaction.modelQuery;
      const meta = await transaction.countTotal(); 
    return {result, meta}
  }
 
const TransitionsService = { 
    transitionsHistoryUser,
    transitionsHistoryPartner
  }
  
  module.exports = TransitionsService;