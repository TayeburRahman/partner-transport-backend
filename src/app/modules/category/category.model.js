const { model, Schema } = require("mongoose");

const categorySchema = new Schema(
  {
    serviceType: {
      type: String,
      enum: ["move", "sell"],
      required: [true, "Service type is required"],
    },
    subServiceType: {
      type: String,
      enum: ["Goods", "Waste", "Second-hand items", "Recyclable materials"],
      required: [true, "subServiceType is required"],
    },
    category: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Category = model("Category", categorySchema);

module.exports = Category;
