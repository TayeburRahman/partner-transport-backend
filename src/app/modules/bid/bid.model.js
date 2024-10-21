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

const Bids = model("Bids", bidsSchema);

module.exports = Bids;
