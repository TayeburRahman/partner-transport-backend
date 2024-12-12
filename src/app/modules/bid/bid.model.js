const mongoose = require("mongoose");

const { Types, Schema, model } = mongoose;

const bidsSchema = new Schema(
  {
    service: {
      type: mongoose.Schema.ObjectId,
      ref: "Services",
    }, 
    partner: {
      type: mongoose.Schema.ObjectId,
      ref: "Partner",
    }, 
    serviceType: {
      type: String,
      enum: ["Goods", "Waste", "Second-hand items", "Recyclable materials"],
    },
    price: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["Win", "Outbid","Pending"],
      default: "Pending",
    }, 
  },
  {
    timestamps: true,
  }
);
 

const reviewSchema = new Schema(
  {
    serviceId: {
      type: mongoose.Schema.ObjectId,
      ref: "Services",
    }, 
    partnerId: {
      type: mongoose.Schema.ObjectId,
      ref: "Partner",
    }, 
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    }, 
    rating: {
      type: Number,
      default: 0,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
 

const fileClaimSchema = new Schema(
  {
    serviceId:{
      type: mongoose.Schema.ObjectId,
      ref: "Services",
      required: true,  
    },
    user:{
      type: mongoose.Schema.ObjectId,
      refPath: "againstType",
      required: true, 
    },
    userType:{
      type: String,
      enum: ["User", "Partner"],
      required: true, 
    },
    description:{
      type: String,
      required: true, 
    },
    fileClaimImage:{
      type: [String],   
    },
    status:{
      type: String,
      enum: ["pending", "in-progress", "resolved"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FileClaim", fileClaimSchema);


const FileClaim = model("FileClaim", fileClaimSchema); 
const Review = model("Review", reviewSchema); 
const Bids = model("Bids", bidsSchema); 

module.exports = { Review, Bids, FileClaim};
