const { default: mongoose } = require("mongoose");
const QueryBuilder = require("../../../builder/queryBuilder");
const ApiError = require("../../../errors/ApiError");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const { NotificationService } = require("../notification/notification.service");
const { Tickets } = require("./support.model");

// ==============================
//  Tickets 
// ==============================
const createTicket = async (req) => {
    const { userId, role } = req.user;
    const { number, email, description } = req.body;
    
    let type;
    if (role === ENUM_USER_ROLE.USER) {
        type = "User";
    }else if (role === ENUM_USER_ROLE.PARTNER) {
        type = "Partner";
    }

    if (!number ||!email ||!description) {
        throw new ApiError(404,"All fields are required");
    }

    const ticketData = {
        userType: type,
        user: userId, 
        number,
        email,
        description,
    };

    const ticket = await Tickets.create(ticketData);
    if (!ticket) {
        throw new ApiError(400,"Failed to create ticket");
    }
    return ticket;
  };
  
  const repliedTicket = async(req) =>{
    const { reply } = req.body
    const { ticketId } = req.params;
    const { userId } = req.user;

    const ticketDb = await Tickets.findById(ticketId);

    const ticket = await Tickets.findByIdAndUpdate(
         ticketId, 
        {replied: reply, status: "Replied"}, 
        { new: true }
    );
    if (!ticket) {
        throw new ApiError(404,"Ticket not found");
    }
    await NotificationService.sendNotification({ 
        title: "Ticket Reply Notification", 
        message: "Your ticket has been replied to. Please review the response at your earliest convenience.", 
        user: userId, 
        userType: ticketDb.userType,   
        getId: ticket._id,
        types: 'ticket'
    })

    return ticket;

  }

  const getTicketDb = async (req) => {
    try {
      const { page = 1, limit = 10, searchTerm } = req.query;
      const skip = (page - 1) * limit;
   
      const baseQuery = {};
   
      if (searchTerm) { 
        const userTypes = await Tickets.distinct('userType');
        
        const matchingUserIds = [];
        for (const userType of userTypes) {
          const modelName = userType; 
          const model = mongoose.model(modelName);
   
          const matchingUsers = await model.find(
            { name: { $regex: searchTerm, $options: 'i' } },
            { _id: 1 }
          ); 
          matchingUserIds.push(...matchingUsers.map((user) => user._id));
        }
   
        if (matchingUserIds.length === 0) {
          return {
            totalTickets: 0,
            totalPages: 0,
            currentPage: page,
            tickets: [],
          };
        } 
        baseQuery.user = { $in: matchingUserIds };
      }   
      const totalTickets = await Tickets.countDocuments(baseQuery);

      const tickets = await Tickets.find(baseQuery)
        .populate({
          path: 'user', 
        })
        .skip(skip)
        .limit(parseInt(limit, 10));
  
      return {
        totalTickets,
        totalPages: Math.ceil(totalTickets / limit),
        currentPage: parseInt(page),
        tickets,
      };
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw error;
    }
  };
  
  const getTicketDetails = async (req) => {
    const { id } = req.params; 
    const ticket = await Tickets.findById(id)
     .populate({
        path: 'user',
      });
    
      return ticket; 
  }
  
  
  

   
  
  const SupportService = { 
    createTicket,
    repliedTicket,
    getTicketDb,
    getTicketDetails
  };
  
  module.exports = { SupportService };







 