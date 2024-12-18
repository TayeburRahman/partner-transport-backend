const httpStatus = require("http-status");

const Conversation = require("./conversation.model");
const ApiError = require("../../../errors/ApiError");
const User = require("../user/user.model");
const Partner = require("../partner/partner.model");
const Admin = require("../admin/admin.model");

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

    console.log("===", conversation)

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



const conversationUser = async (payload) => {
  try {
    const { searchTerm } = payload;
 
    const conversations = await Conversation.find({});
 
    const participantIds = conversations.flatMap((convo) =>
      convo.participants.map((participantId) => participantId.toString())
    );
 
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

    const participantMap = {};

    [...users, ...partners, ...admins].forEach((participant) => {
      participantMap[participant._id.toString()] = {
        ...participant.toObject(),
        type:
          participant instanceof User
            ? "User"
            : participant instanceof Partner
            ? "Partner"
            : "Admin",
      };
    });
 
    const conversationsWithParticipants = conversations.map((convo) => ({
      ...convo.toObject(),
      messages: undefined, 
      participants: convo.participants.map(
        (participantId) => participantMap[participantId.toString()]
      ),
    }));
 
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
    throw new Error("Failed to fetch conversations");
  }
};



const MessageService = {
  getMessages,
  conversationUser,
};

module.exports = { MessageService };
