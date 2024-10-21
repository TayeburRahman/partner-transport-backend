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
      required: true,
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
  },
  {
    timestamps: true,
  }
);

// Statics
const Admin = model("Admin", AdminSchema);

module.exports = Admin;
