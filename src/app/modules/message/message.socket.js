const { ENUM_SOCKET_EVENT, ENUM_USER_ROLE } = require("../../../utils/enums");
const Admin = require("../admin/admin.model");
const { NotificationService } = require("../notification/notification.service");
const Partner = require("../partner/partner.model");
// const Partner = require("../Partner/Partner.model");
const User = require("../user/user.model");
const Conversation = require("./conversation.model");
const Message = require("./message.model");


const handleMessageData = async (receiverId, role, socket, io, onlineUsers) => {

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
        const { senderId, text, userType } = data;

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

         // =====
        let userRoleType = null;
        let previousNotification;
        
        const user = await User.findOne({ _id: senderId });
        if (user) {
            userRoleType = "User";
        } else {
            const partner = await Partner.findOne({ _id: senderId });
            if (partner) {
                userRoleType = "Partner";
            } else {
                const admin = await Admin.findOne({ _id: senderId });
                if (admin) {
                    userRoleType = "Admin";
                }
            }
        }
         // =====
        let adminType = false;
        const admin = await Admin.findOne({ _id: receiverId });
        if (admin) {
            adminType = true;
        } 
         // =====

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            }); 

            previousNotification = await NotificationService.sendNotification({
                title: `New Message from ${userRoleType || "Unknown"}`,
                message: `You have received a new message from a ${userRoleType || "user"}. Please check the conversation.`,
                user: senderId,
                userType: userRoleType,
                getId: receiverId,
                types: 'new-message',
                isAdmin: adminType,
            }) 
        } 

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            isAdmin: adminType,
            conversationId: conversation._id,
        });

        conversation.messages.push(newMessage._id);
        await Promise.all([conversation.save(), newMessage.save()]);
        
         // =====
        if(!previousNotification && adminType) {
            await NotificationService.sendNotification({
                title: `New Message from ${userRoleType || "Unknown"}`,
                message: `You have received a new message from a ${userRoleType || "user"}. Please check the conversation.`,
                user: senderId,
                userType: userRoleType,
                getId: receiverId,
                types: 'new-message',
                isAdmin: adminType,
            }) 
        } 
       // =====
        await emitMassage(senderId, newMessage, `${ENUM_SOCKET_EVENT.MESSAGE_NEW}/${receiverId}`)
        await emitMassage(receiverId, newMessage, `${ENUM_SOCKET_EVENT.MESSAGE_NEW}/${senderId}`)

    },
    );
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
