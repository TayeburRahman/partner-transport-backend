const { model, Schema } = require("mongoose");

const variableSchema = new Schema(
  {
    surcharge: {
      type: Number,
      default: 0,
    },
    coverageRadius: {
      type: Number,
      default: 10000,
    },
  },
  {
    timestamps: true,
  }
);

const Variable = model("Variable", variableSchema);

module.exports = Variable;
