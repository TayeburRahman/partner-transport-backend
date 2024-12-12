const { ENUM_SOCKET_EVENT, ENUM_USER_ROLE } = require("../../../utils/enums");
const Partner = require("../partner/partner.model");
// const Partner = require("../Partner/Partner.model");
const User = require("../user/user.model");
const Conversation = require("./conversation.model");
const Message = require("./message.model");



const handleMessageData = async (receiverId, role, socket, io) => {

    // Get one to one - all conversation messages
    socket.on(ENUM_SOCKET_EVENT.MESSAGE_GETALL, async (data) => {
        const { senderId, page } = data;

        if (!senderId) {
            socket.emit('error', {
                message: 'SenderId not found!',
            });
            return;
        }


        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        }).populate({
            path: 'messages',
            options: {
                sort: { createdAt: -1 },
                skip: (page - 1) * 20,
                limit: 20,
            },
        });

        console.log('conversation', conversation)

        if (!conversation) {
            return 'Conversation not found';
        }

        if (conversation) {
            await emitMassage(receiverId, conversation, ENUM_SOCKET_EVENT.MESSAGE_GETALL)
        }
    },
    );

    // Create a new chat message and send it to both participants.
    socket.on(ENUM_SOCKET_EVENT.MESSAGE_NEW, async (data) => {
        const { senderId, text } = data;
        // console.log("=================", senderId, text );
        if (!senderId || !text) {
            socket.emit('error', {
                message: 'SenderId Or text not found!',
            });
            return;
        }

        if (!receiverId || !senderId) {
            throw new ApiError(404, 'Sender or Receiver user not found');
        }

        let conversation = await Conversation.findOne({
            participants: { $all: [receiverId, senderId] },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            conversationId: conversation._id,
        });

        conversation.messages.push(newMessage._id);
        await Promise.all([conversation.save(), newMessage.save()]);

        await emitMassage(senderId, newMessage, ENUM_SOCKET_EVENT.MESSAGE_NEW)
        await emitMassage(receiverId, newMessage, ENUM_SOCKET_EVENT.MESSAGE_NEW)

    },
    );

    // get all conversation list with last message
    socket.on(ENUM_SOCKET_EVENT.CONVERSION, async (data) => {
        try {
            const conversations = await Conversation.find({
                participants: { $in: [receiverId] },
            }).populate({
                path: 'messages',
                options: {
                    sort: { createdAt: -1 },
                    limit: 1,
                },
            });
             // const update = await Conversation.update({ })
             
            const updatedConversations = conversations.map(convo => {
                const filteredParticipants = convo.participants.filter(
                    participantId => participantId.toString() !== receiverId
                );

                return {
                    ...convo.toObject(),
                    participants: filteredParticipants,
                };
            });

            const participantIds = updatedConversations.flatMap(convo => convo.participants);
            // Fetch users and partner concurrently
            const [users, partner] = await Promise.all([
                User.find({ _id: { $in: participantIds } }).select('_id name email profile_image'),
                Partner.find({ _id: { $in: participantIds } }).select('_id name email profile_image'),
            ]);

            // Build a map of participants
            const participantMap = {};
            [...users, ...partner].forEach(participant => {
                participantMap[participant._id.toString()] = {
                    ...participant.toObject(),
                    type: participant instanceof User ? 'User' : 'Partner',
                };
            });

            const conversationsWithParticipants = updatedConversations.map(convo => ({
                ...convo,
                participants: convo.participants.map(
                    participantId => participantMap[participantId.toString()]
                ),
            }));


            await emitMassage(receiverId, conversationsWithParticipants, ENUM_SOCKET_EVENT.CONVERSION);
        } catch (error) {
            console.error('Error fetching conversations or emitting message:', error);
        }
    });

}

const emitMassage = (receiver, data, emit_massage) => {
    if (global.io) {
        const socketIo = global.io;
        socketIo.to(receiver.toString()).emit(emit_massage, data);
    } else {
        console.error('Socket.IO is not initialized');
    }
};

module.exports = {
    handleMessageData,
    //  sendNotification, 
    emitMassage

}
