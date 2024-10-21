const httpStatus = require("http-status");

const Conversation = require("./conversation.model");
const ApiError = require("../../../errors/ApiError");
const User = require("../user/user.model");
const Partner = require("../partner/partner.model");

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

  if (!conversation) {
    throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found");
  }

  return { count: conversation.messages.length, conversation };
};

const conversationUser = async (payload) => {
  try {
    const conversations = await Conversation.find({}).populate({
      path: "messages",
      options: {
        // sort: { createdAt: -1 },
        // limit: 3,
      },
    });

    const updatedConversations = conversations.map((convo) => {
      const filteredParticipants = convo.participants.filter((participantId) =>
        participantId.toString()
      );

      return {
        ...convo.toObject(),
        participants: filteredParticipants,
      };
    });

    const participantIds = updatedConversations.flatMap(
      (convo) => convo.participants
    );

    const [users, partner] = await Promise.all([
      User.find({ _id: { $in: participantIds } }).select(
        "_id name email profile_image"
      ),
      Partner.find({ _id: { $in: participantIds } }).select(
        "_id name email profile_image"
      ),
    ]);

    // Build a map of participants
    const participantMap = {};

    [...users, ...partner].forEach((participant) => {
      participantMap[participant._id.toString()] = {
        ...participant.toObject(),
        type: participant instanceof User ? "User" : "Driver",
      };
    });

    const conversationsWithParticipants = updatedConversations.map((convo) => ({
      ...convo,
      participants: convo.participants.map(
        (participantId) => participantMap[participantId.toString()]
      ),
    }));

    return conversationsWithParticipants;
  } catch (error) {
    console.error("Error fetching conversations or emitting message:", error);
  }
};

const MessageService = {
  getMessages,
  conversationUser,
};

module.exports = { MessageService };
