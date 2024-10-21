const ServicesSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    service: {
      type: String,
      enum: ["Goods", "Waste", "Sell"],
      required: [true, "Service type is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    scheduleDate: {
      type: Date,
      required: [true, "Schedule Date is required"],
    },
    scheduleTime: {
      type: Date,
      required: [true, "Schedule Time is required"],
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
      type: Date,
      required: [true, "Deadline Date is required"],
    },
    deadlineTime: {
      type: Date,
      required: [true, "Deadline Time is required"],
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
    image: {
      type: [String],
      required: [true, "At least one image is required"],
    },

    // other fields =======================================
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "cancel",
        "completed",
        "processing",
        "pick-up",
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
  },
  {
    timestamps: true,
  }
);
