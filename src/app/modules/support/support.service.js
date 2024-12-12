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
        types: 'ticket'
    })

    return ticket;

  }
  
  const SupportService = { 
    createTicket,
    repliedTicket
  };
  
  module.exports = { SupportService };







 