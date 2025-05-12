const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const UserSchema = new Schema(
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
      default: null,
    },
    phone_c_code: {
      type: String,
      default: null,
    },
    isPhoneNumberVerified: {
      type: Boolean,
      default: false,
    }, 
    neighborhood: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
    street:{
      type: String,
      default: null,
    },
    exterior_number:{
      type: String,
      default: null,
    },
    interior_number:{
      type: String,
      default: null,
    },
    state: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      default: null,
    }, 
    date_of_birth: {
      type: Date,
    },
    wallet:{
      type: Number,
      default: 0,
    },
    bank_holder_name:{
      type: String,
      default: null,
    },
    bank_holder_type:{
      type: String, 
      default: null,
    },
    bank_name:{
      type: String, 
      default: null,
    },
    bank_account_number:{
      type: String, 
      default: null,
    },
    routing_number:{
      type: String, 
      default: null,
    },
    date_of_birth:{
      type: Date,
      default: null,
    },
    address_line:{
      type: String,
      default: null,
    },
    address_city:{
      type: String,
      default: null,
    },
    address_state:{
      type: String,
      default: null,
    },
    address_postal_code:{
      type: String,
      default: null,
    }, 
    status: {
      type: String,
      enum: ["active", "deactivate"],
      default: "active"
    },
  },
  {
    timestamps: true,
  }
);

const User = model("User", UserSchema);

module.exports = User;
