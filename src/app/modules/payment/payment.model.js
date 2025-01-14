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
  fileClaimImage:{
    type: [String],
    default: null,
  }
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

 

 

const AddressSchema = new mongoose.Schema({
  line1: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postal_code: { type: String, required: true },
  country: { type: String, required: true },
  phone_number: { type: String},
  personal_rfc: { type: String, }
});

const BankInfoSchema = new mongoose.Schema({
  account_holder_name: { type: String, required: true },
  account_holder_type: { type: String, required: true, enum: ['individual', 'company'] },
  account_number: { type: String, required: true },
  routing_number: { type: String}, 
  country: { type: String, required: true },
  currency: { type: String, required: true }
});

const BusinessProfileSchema = new mongoose.Schema({
  business_name: { type: String, required: true },
  website: { type: String, },
  product_description: { type: String}
});

const stripeAccountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: "Unknown",
  },
  email: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",  
    required: true,
  },
  userType: {
    type: String,
    enum: ['User', 'Partner', 'Admin'],
    required: true,
  },
  stripeAccountId: {
    type: String,
    required: true,
  },
  address: { 
    type: AddressSchema, 
    required: true 
  },
  bank_info: { 
    type: BankInfoSchema, 
    required: true
   },
  business_profile: { 
    type: BusinessProfileSchema, 
    required: true 
  },
  externalAccountId:{
    type: String, 
    required: true
  },
  dateOfBirth: { 
    type: Date, 
    required: true 
  }
}); 

const StripeAccount = mongoose.model("StripeAccount", stripeAccountSchema);  
const Withdraw = mongoose.model('Withdraw', withdrawSchema); 
const Transaction = mongoose.model('Transaction', transactionSchema); 
 

module.exports = { Transaction, Withdraw, StripeAccount};
