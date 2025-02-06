const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const locationSchema = new Schema({
  type: {
    type: String,
    enum: ["Point"],
    default: "Point",
  },
  coordinates: {
    type: [Number],
    required: true,
  },
});

const PartnerSchema = new Schema(
  {
    authId: {
      type: Schema.ObjectId,
      required: true,
      ref: "Auth",
    },
    name: {
      type: String,
      required: true,
    },
    // playerIds:{
    //   type: [String],
    //   default: null,
    // },
    email: {
      type: String,
      required: true,
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
    neighborhood: {
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
    date_of_birth: {
      type: String,
      default: null,
    },
    isPhoneNumberVerified: {
      type: Boolean,
      default: false,
    },
    profile_image: {
      type: String,
      default: null,
    },
    licensePlateImage: {
      type: String,
      default: null,
    },
    drivingLicenseImage: {
      type: String,
      default: null,
    },
    vehicleInsuranceImage: {
      type: String,
      default: null,
    },
    vehicleRegistrationCardImage: {
      type: String,
      default: null,
    },
    vehicleFrontImage: {
      type: String,
      default: null,
    },
    vehicleBackImage: {
      type: String,
      default: null,
    },
    vehicleSideImage: {
      type: String,
      default: null,
    },
    bank_holder_name: {
      type: String,
      default: null,
    },
    bank_holder_type: {
      type: String,
      default: null,
    },
    bank_account_number: {
      type: String,
      default: null,
    },
    routing_number: {
      type: String,
      default: null,
    },
    date_of_birth: {
      type: Date,
      default: null,
    },
    address_line: {
      type: String,
      default: null,
    },
    address_city: {
      type: String,
      default: null,
    },
    address_state: {
      type: String,
      default: null,
    },
    address_postal_code: {
      type: String,
      default: null,
    },
    paypalEmail: {
      type: String,
    },
    rating: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "declined"],
      default: "pending",
    },
    wallet: {
      type: Number,
      default: 0,
    },
    current_trip_user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    location: {
      type: locationSchema,
    },
  },
  {
    timestamps: true,
  }
);

const Partner = model("Partner", PartnerSchema);

module.exports = Partner; 
