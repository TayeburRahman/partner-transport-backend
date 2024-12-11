const mongoose = require("mongoose");
const { model } = require("mongoose");

const termsAndConditionsSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

const privacySchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const contactSchema = new mongoose.Schema(
  {
    contact: {
      type: String,
      required: true,
    },
  } 
);

module.exports = {
  ContactNumber: model("ContactNumber", contactSchema),
  PrivacyPolicy: model("PrivacyPolicy", privacySchema),
  TermsConditions: model("TermsConditions", termsAndConditionsSchema),
};
