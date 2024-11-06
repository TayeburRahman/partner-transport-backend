const { model, Schema } = require("mongoose");

const variableSchema = new Schema(
  {
    surcharge: {
      type: Number,
      default: 1
    },
    coverageRadius: {
      type: Number,
      default: 1
    },
    minimumStartFee: {
      type: Number,
      default: 1
    },
    maximumStartFee: {
      type: Number,
      default: 1
    },
    minimumWeightLoad: {
      type: Number,
      default: 1
    },
    maximumWeightLoad: {
      type: Number,
      default: 1
    },
    minimumDurationFee: {
      type: Number,
      default: 1
    },
    maximumDistanceOfFee: {
      type: Number,
      default: 1
    },
    perDollarMexicanPeso: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true,
  }
);

const Variable = model("Variable", variableSchema);

module.exports = Variable;
