const { Schema, default: mongoose } = require("mongoose");
const { ENUM_NOTIFICATION_TYPE } = require("../../../utils/enums");

const notificationSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      // required: true,
      ref: "Job",
    },
    userId: {
      type: String, 
      ref: "User",
    },
    driverId: {
      type: String, 
      ref: "Driver",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    }, 
    // otp: {
    //   type: Number,
    //   default: null,
    // },
    seen: {
      type: Boolean,
      default: false,
    }, 
  },
  {
    timestamps: true,
  }
);

const Notification = new mongoose.model("Notification", notificationSchema);

module.exports = Notification;
