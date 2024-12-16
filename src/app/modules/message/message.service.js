const httpStatus = require("http-status");

const Conversation = require("./conversation.model");
const ApiError = require("../../../errors/ApiError");
const User = require("../user/user.model");
const Partner = require("../partner/partner.model");
const Admin = require("../admin/admin.model");

const getMessages = async (query) => {
  const { senderId, receiverId, page = 1, limit = 20 } = query;

  const conversation = await Conversation.findOne({
    participants: { $all: [senderId, receiverId] },
  }).populate({
    path: "messages",
    options: {
      sort: { createdAt: -1 },
      skip: (page - 1) * 20,
      limit: limit,
    },
  });

  return { count: conversation?.messages?.length, conversation};
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
