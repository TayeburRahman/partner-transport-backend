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
      type: String,
      required: [true, "Category is required"],
    },
    scheduleDate: {
      type: String,
      required: [true, "Schedule Date is required"],
    },
    scheduleTime: {
      type: String,
      required: [true, "Schedule Time is required"],
    },
    rescheduledDate: {
      type: String,
    },
    rescheduledTime: {
      type: String,
    },
    rescheduledReason: {
      type: String,
    },
    rescheduledStatus: {
      type: String,
      enum: ["pending", "accepted", "decline"],
    },
    numberOfItems: {
      type: Number,
      required: [true, "Number of items is required"],
    },
    weightMTS: {
      type: Number,
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
      type: String,
      required: [true, "Deadline Date is required"],
    },
    deadlineTime: {
      type: String,
      required: [true, "Deadline Time is required"],
    },
    minPrice: {
      type: Number,
    },
    maxPrice: {
      type: Number,
    },
    isLoaderNeeded: {
      type: Boolean,
      required: [true, "Loader needed status is required"],
    },
    loadFloorNo: {
      type: String,
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
      type: String,
    },
    unloadingAddress: {
      type: String,
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
      enum: ["pending", "paid", "failed","refunded"],
      default: "pending",
    },
    transactionId: {
      type: String,
      trim: true,
      unique: true, 
  }
  },
  {
    timestamps: true,
  }
);

ServicesSchema.index({ loadingLocation: "2dsphere" });

const Services = model("Services", ServicesSchema);

module.exports = Services;
