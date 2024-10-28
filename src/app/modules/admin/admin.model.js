const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const AdminSchema = new Schema(
  {
    authId: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "Auth",
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    profile_image: {
      type: String,
      default: null,
    },
    phone_number: {
      type: String, 
    },
    address: {
      type: String,
      default: null,
    },
    location: {
      type: String,
      default: null,
    },
    date_of_birth: {
      type: String,
      default: null,
    },
    accTo_auction_manage:{
      type: Boolean,
      default: false,
    },
    accTo_user_manage:{
      type: Boolean,
      default: false,
    },
    accTo_partner_manage:{
      type: Boolean,
      default: false,
    },
    accTo_transaction:{
      type: Boolean,
      default: false,
    },
    accTo_category_manage:{
      type: Boolean,
      default: false,
    }, 
    accTo_review_conversation:{
      type: Boolean,
      default: false,
    },
    accTo_bank_transfer:{
      type: Boolean,
      default: false,
    },
    accTo_support:{
      type: Boolean,
      default: false,
    },
    accTo_settings:{
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Statics
const Admin = model("Admin", AdminSchema);

module.exports = Admin;
