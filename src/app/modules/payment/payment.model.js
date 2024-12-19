const mongoose = require('mongoose');
const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const transactionSchema = new Schema({
  serviceId: {
    type: ObjectId,
    ref: 'Services', 
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
    enum: ['Stripe', 'PayPal', 'ApplePay', 'GooglePay', "BankTransfer"],
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
    },
    currency: {
      type: String,
      default: 'USD',
    },
  },
}, { timestamps: true });

const withdrawSchema = new Schema({
  user: {
    type: ObjectId,
    refPath: 'userType',
    required: true,
  },
  userType: {
    type: String,
    enum: ['User', 'Partner'],
    required: true,
  },
  name: {
    type: String, 
    required: true,
  },
  request_amount: {
    type: Number,
    required: true,
  }, 
  bankTransferId:{
    type: String, 
  },
  status:{
    type: String,
    enum: ['Pending', 'Completed'],
    default: 'Pending',
  }
   
 
}, { timestamps: true });

// Registering the model
const Withdraw = mongoose.model('Withdraw', withdrawSchema); 
const Transaction = mongoose.model('Transaction', transactionSchema); 
 

module.exports = { Transaction, Withdraw};
