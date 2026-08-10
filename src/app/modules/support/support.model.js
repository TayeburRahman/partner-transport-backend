const { model } = require("mongoose");
const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    userType: {
      type: String,
      enum: ["User", "Partner"],  
      required: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "userType", 
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    reasons: {
      type: String,
    },
    details: {
      type: String,
    },
    email: {
      type: String, 
    },
    number: {
      type: String, 
    },
    replied: {
      type: String,
      default: null,  
    },
    status: {
      type: String,
      enum: ["Pending", "Replied"],  
      default: "Pending", 
    },
  },
  {
    timestamps: true, 
  }
);

// Add indexes to improve query performance
ticketSchema.index({ userType: 1, user: 1 });
ticketSchema.index({ status: 1 });

module.exports = {
  Tickets: model("Ticket", ticketSchema), 
}