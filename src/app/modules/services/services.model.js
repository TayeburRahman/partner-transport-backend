const mongoose = require("mongoose");

const { Types, Schema, model } = mongoose;

const locationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  { _id: false }
);

const ServicesSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    mainService: {
      type: String,
      enum: ["move", "sell"],
      required: [true, "mainService is required"],
    },
    service: {
      type: String,
      enum: ["Goods", "Waste", "Second-hand items", "Recyclable materials"],
      required: [true, "Service type is required"],
    },
    category: {
      type: [mongoose.Schema.ObjectId],
      ref: "Category",
      required: [true, "Category is required"],
    },
    scheduleDate: {
      type: Date,
      required: [true, "Schedule Date is required"],
    },
    scheduleTime: {
      type: String,
      required: [true, "Schedule Time is required"],
    },
    rescheduledDate: {
      type: Date,
      default:null
    },
    rescheduledTime: {
      type: String,
      default:null
    },
    doYouDestinationLocation:{
      type: Boolean,
      // required: [true, "Do you have a destination location? is required"],
    },
    rescheduledReason: {
      type: String,
      default:null
    },
    rescheduledStatus: {
      type: String,
      enum: ["pending", "accepted", "decline"],
      default:null
    },
    numberOfItems: {
      type: Number,
      required: [true, "Number of items is required"],
    },
    weightMTS: {
      type: String,
      required: [true, "weight in MTS is required"],
    }, 
    weightKG: {
      type: Number,
      required: [true, "weight in KG is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    deadlineDate: {
      type: Date,
      required: [true, "Deadline Date is required"],
    },
    deadlineTime: {
      type: String,
      required: [true, "Deadline Time is required"],
    },
    price: {
      type: Number,
      default: 1,
    },
    isLoaderNeeded: {
      type: Boolean,
      required: [true, "Loader needed status is required"],
    },
    loadFloorNo: {
      type: Number,
      required: [true, "Loading floor number is required"],
    },
    loadingAddress: {
      type: String,
      required: [true, "Loading address is required"],
    },
    loadingLocation: {
      type: locationSchema,
      required: [true, "Loading longitude and latitude is required"],
    },
    image: {
      type: [String],
      required: [true, "At least one image is required"],
    },
    isUnloaderNeeded: {
      type: Boolean,
    },
    unloadFloorNo: {
      type: Number,
      default: 1,
    },
    unloadingAddress: {
      type: String,
      default: null
    },
    unloadingLocation: {
      type: locationSchema,
    },
    bestBid: {
      type: Number,
      default: 0,
    },
    winBid: {
      type: Number,
      default:null
    },
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rescheduled",
        "pick-up",
        "in-progress",
        "completed",
        "cancel",
      ],
      default: "pending",
    },
    user_status: {
      type: String,
      enum: [
        "pending",
        "confirm-arrived",
        "goods-loaded",
        "partner-at-destination",
        "delivery-confirmed" 
      ],
      default: "pending",
    },
    partner_status: {
      type: String,
      enum: [
        "pending",
        "arrived",
        "start-trip",
        "arrive-at-destination",
        "delivered", 
      ],
      default: "pending",
    },
    bids: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Bids",
      },
    ],
    confirmedPartner: {
      type: mongoose.Schema.ObjectId,
      ref: "Partner",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    transactionId: {
      type: String,
      trim: true,
      default:null
    },
    isReviewed:{
      type: Boolean,
      default: false,
    },
    distance: {
      type: Number,
      default: 0.1,
    }
  },
  {
    timestamps: true,
  }
);

ServicesSchema.index({ loadingLocation: "2dsphere" });

const Services = model("Services", ServicesSchema);

module.exports = Services;
