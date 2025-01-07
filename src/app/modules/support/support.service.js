const { default: mongoose } = require("mongoose");
const QueryBuilder = require("../../../builder/queryBuilder");
const ApiError = require("../../../errors/ApiError");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const { NotificationService } = require("../notification/notification.service");
const { Tickets } = require("./support.model");
const { LogsDashboardService } = require("../logs-dashboard/logsdashboard.service");
const Notification = require("../notification/notification.model");

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

    // if (!number ||!email ||!description) {
    //     throw new ApiError(404,"All fields are required");
    // }

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
    await Notification.create({
      title: "New Support Ticket",
      message: `${type} with email ${email} has created a support ticket.`,
      userType:"Admin",
      types: 'none',
      admin: true,
    });

    return ticket;
  };
  
  const repliedTicket = async (req) => {
    const { reply } = req.body;
    const { ticketId } = req.params;
    const { userId, emailAuth } = req.user;
  
    if (!reply || !ticketId) {
      throw new ApiError(400, "Reply content and ticket ID are required.");
    }
  
    try {
      const ticketDb = await Tickets.findById(ticketId);
  
      if (!ticketDb) {
        throw new ApiError(404, "Ticket not found.");
      }
  
      const ticket = await Tickets.findByIdAndUpdate(
        ticketId,
        { replied: reply, status: "Replied" },
        { new: true }
      );
  
      if (!ticket) {
        throw new ApiError(404, "Ticket update failed.");
      }
  
      // Send notification to the user
      await NotificationService.sendNotification({
        title: {
          eng: "Ticket Reply Notification",
          span: "Notificación de Respuesta al Ticket"
        },
        message: {
          eng: "Your ticket has been replied to. Please review the response at your earliest convenience.",
          span: "Tu ticket ha recibido una respuesta. Por favor, revisa la respuesta a la brevedad."
        },
        user: ticketDb.user,
        userType: ticketDb.userType,
        getId: ticket._id,
        types: "ticket",
      });
  
      // Log success
      const newTask = {
        admin: userId,
        email: emailAuth,
        description: `Ticket with ID ${ticketId} successfully replied to.`,
        types: "Update",
        activity: "task",
        status: "Success",
        attended:"tickets"
      };
      await LogsDashboardService.createTaskDB(newTask);
  
      return ticket;
    } catch (error) {
      // Log failure
      const newTask = {
        admin: userId,
        email: emailAuth,
        description: `Failed to reply to ticket with ID ${ticketId}: ${error.message || "Unknown error"}.`,
        types: "Failed",
        activity: "task",
        status: "Error",
      };
      await LogsDashboardService.createTaskDB(newTask);
  
      throw new ApiError(
        error.status || httpStatus.INTERNAL_SERVER_ERROR,
        error.message || "An error occurred while replying to the ticket."
      );
    }
  };
  
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







 