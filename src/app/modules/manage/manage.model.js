const mongoose = require("mongoose");
const { model } = require("mongoose");

const termsAndConditionsSchema = new mongoose.Schema(
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

module.exports = {
  PrivacyPolicy: model("PrivacyPolicy", privacySchema),
  TermsConditions: model("TermsConditions", termsAndConditionsSchema),
};
