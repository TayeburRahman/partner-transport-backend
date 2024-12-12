const mongoose = require("mongoose");
const { model } = require("mongoose");

const ticketSchema = new mongoose.Schema(
  { 
    userType:{
      type: String,
      enum: ['User', 'Partner'],
      required: true,
    },
    user:{
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'userType',
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    number: {
      type: String,
      required: true,
    },
    replied:{
      type: String,
    },
    status: {
      type: String,
      enum: ['Pending', 'Replied'],
      default: 'Pending',
    }
  },
  {
    timestamps: true,
  }
);

// const privacySchema = new mongoose.Schema(
//   {
//     description: {
//       type: String,
//       required: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// const contactSchema = new mongoose.Schema(
//   {
//     contact: {
//       type: String,
//       required: true,
//     },
//   } 
// );

module.exports = {
  Tickets: model("Ticket", ticketSchema),
  // PrivacyPolicy: model("PrivacyPolicy", privacySchema),
  // TermsConditions: model("TermsConditions", termsAndConditionsSchema),
};
