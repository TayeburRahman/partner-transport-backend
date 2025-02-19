

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const conversationSchema = new Schema(
  {
    types:{
      type: String,
      enum: ['direct', 'service'],
      default: 'direct',
    },
    serviceId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service', 
    },
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

