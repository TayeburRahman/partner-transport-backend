const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const messageSchema = new Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      // ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      // ref: 'User',
      required: true,
    },
    // conversationId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'Conversation',
    //   required: true,
    // },

    text: {
      type: String,
    },

    image: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
  },
);

const Message = model("Message", messageSchema);

module.exports = Message;
