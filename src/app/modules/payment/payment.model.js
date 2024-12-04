const mongoose = require('mongoose');
const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const transactionSchema = new Schema({
  serviceId: {
    type: ObjectId,
    ref: 'Services',
    required: true,
  },
  payUserType: {
    type: String,
    enum: ['User', 'Partner', 'Admin'],
    required: true,
  },
  payUser: {
    type: ObjectId,
    refPath: 'payUserType',
    required: true,
  },
  receiveUser: {
    type: ObjectId,
    refPath: 'receiveUserType',
    required: true,
  },
  receiveUserType: {
    type: String,
    enum: ['User', 'Partner', 'Admin'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['Stripe', 'PayPal', 'ApplePay', 'GooglePay'],
    required: true,
  },
  transactionId: {
    type: String,
    trim: true,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Completed', 'Pending', 'Failed', 'Refunded'],
    required: true,
  },
  isFinish: {
    type: Boolean,
    default: false,
  },
  payType: {
    type: String,
    enum: ['sell', 'move', 'fine', 'withdraw'],
    default: null,
  },
  finePercent: {
    type: Number, 
    default: null,
  },
  fineReason:{
    type: String,
    default: null,
  },
  paymentDetails: {
    email: {
      type: String,
    },
    payId: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
  },
}, { timestamps: true });

// Registering the model
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = { Transaction };
