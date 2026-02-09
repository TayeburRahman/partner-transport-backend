const httpStatus = require("http-status");

const Conversation = require("./conversation.model");
const ApiError = require("../../../errors/ApiError");
const User = require("../user/user.model");
const Partner = require("../partner/partner.model");
const Admin = require("../admin/admin.model");
const Services = require("../services/services.model");

const getMessages = async (req) => {
  const { senderId, receiverId, page = 1, limit = 20 } = req.query;
  const {userId} = req.user;

  try {
    if(!senderId || !receiverId){
      throw new ApiError(httpStatus.BAD_REQUEST, "Missing participant ids.");
    }
    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    }).populate({
      path: "messages",
      options: {
        sort: { createdAt: -1 },  
        skip: (page - 1) * Number(limit),
        limit: Number(limit),
      },
    });

    if (!conversation) {
      return {
        count: 0,
        conversation: null,
        message: "No conversation found between participants.",
      };
    }
//  -------------
    const findParticipant = async (id) => {
      let participant =
        (await User.findOne({ _id: id })) ||
        (await Partner.findOne({ _id: id })) ||
        (await Admin.findOne({ _id: id }));
      return participant;
    };
 
    const [receiver, sender] = await Promise.all([
      findParticipant(receiverId),
      findParticipant(senderId),
    ]);
 
    const getRole = (user) => {
      if (!user) return null;
      if (user.__t === "Admin") return "Admin";
      if (user.__t === "Partner") return "Partner";
      return "User";
    };

    const receiverRole = getRole(receiver);
    const senderRole = getRole(sender); 

    return {
      count: conversation.messages.length,
      conversation,
      participants: {
        sender: {
          id: senderId,
          role: senderRole,
          details: sender,
        },
        receiver: {
          id: receiverId,
          role: receiverRole,
          details: receiver,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching messages:", error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "An error occurred while fetching messages.");
  }
};

const getMessagesServices = async (req) => {
  const { senderId, serviceId, receiverId, page = 1, limit = 20 } = req.query;
  const {userId} = req.user; 

  console.log("Partner", senderId, 'receiverId',receiverId)

  try {
    if(!senderId || !receiverId){
      throw new ApiError(httpStatus.BAD_REQUEST, "Missing participant ids.");
    }
    const conversation = await Conversation.findOne({
      types: "service",
      serviceId: serviceId,
    }).populate({
      path: "messages",
      options: {
        sort: { createdAt: -1 },  
        skip: (page - 1) * Number(limit),
        limit: Number(limit),
      },
    });

    if (!conversation) {
      return {
        count: 0,
        conversation: null,
        message: "No conversation found between participants.",
      };
    }
    // -------------
    const findParticipant = async (id) => {
      let participant =
        (await User.findOne({ _id: id })) ||
        (await Partner.findOne({ _id: id })) ||
        (await Admin.findOne({ _id: id }));
      return participant;
    };
 
    const [receiver, sender] = await Promise.all([
      findParticipant(receiverId),
      findParticipant(senderId),
    ]);
 
    const getRole = (user) => {
      if (!user) return null;
      if (user.__t === "Admin") return "Admin";
      if (user.__t === "Partner") return "Partner";
      return "User";
    };

    const receiverRole = getRole(receiver);
    const senderRole = getRole(sender); 

    const service = await Services.findById(serviceId).select('status partner_status user_status')

    return {
      count: conversation.messages.length,
      service,
      conversation,
      participants: {
        sender: {
          id: senderId,
          role: senderRole,
          details: sender,
        },
        receiver: {
          id: receiverId,
          role: receiverRole,
          details: receiver,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching messages:", error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "An error occurred while fetching messages.");
  }
};

const conversationUser = async (payload) => {
  try {
    const { searchTerm } = payload; 
 
    const conversations = await Conversation.find({});

    // Flatten and collect participant IDs
    const participantIds = conversations.flatMap((convo) =>
      convo.participants.map((participantId) => participantId.toString())
    );

    // Fetch users, partners, and admins concurrently
    const [users, partners, admins] = await Promise.all([
      User.find({ _id: { $in: participantIds } }).select(
        "_id name email profile_image"
      ),
      Partner.find({ _id: { $in: participantIds } }).select(
        "_id name email profile_image"
      ),
      Admin.find({ _id: { $in: participantIds } }).select(
        "_id name email profile_image"
      ),
    ]);

    // Create a map for participants
    const participantMap = {};

    [...users, ...partners, ...admins].forEach((participant) => {
      participantMap[participant._id.toString()] = {
        ...participant.toObject(),
        type: participant.constructor.modelName, 
      };
    });

    // Map conversations with participant details
    const conversationsWithParticipants = conversations.map((convo) => ({
      ...convo.toObject(),
      participants: convo.participants.map(
        (participantId) => participantMap[participantId.toString()]
      ),
    }));

    // Filter by search term if provided
    const filteredConversations = searchTerm
      ? conversationsWithParticipants.filter((convo) =>
          convo.participants.some((participant) =>
            participant.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      : conversationsWithParticipants; 

    return filteredConversations;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    throw new ApiError(400,"Failed to fetch conversations");
  }
};




const MessageService = {
  getMessages,
  conversationUser,
  getMessagesServices
};

module.exports = { MessageService };
