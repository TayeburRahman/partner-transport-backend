

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const conversationSchema = new Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        // ref: 'User',
      },
    ],

    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: [],
      },
    ],
  },
  { timestamps: true },
);

const Conversation = model('Conversation', conversationSchema);

module.exports = Conversation;

