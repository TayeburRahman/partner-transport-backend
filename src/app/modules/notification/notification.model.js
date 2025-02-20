const { Schema, default: mongoose } = require("mongoose");
const { ENUM_NOTIFICATION_TYPE } = require("../../../utils/enums");
const { ObjectId } = Schema.Types;

const notificationSchema = new Schema(
  {
    getId: {
      type: Schema.Types.ObjectId,
    },
    user: {
      type: Schema.Types.ObjectId,
      refPath: 'userType',
      ref: "User",
    },
    isAdmin:{
       type: Boolean,
       default: false,
    },
    userType: {
      type: String,
      enum: ['User', 'Partner', 'Admin'],
      required: true,
    },
    serviceId:{
      type: ObjectId,
      ref: 'Services',
    },
    admin_ms: {
      type: Boolean,
      required: false,
    },
    title: {
      type: {
        eng: { type: String, required: true },
        span: { type: String, required: true },
      },
      required: true,
    }, 
    message: {
      type: {
        eng: { type: String, required: true },
        span: { type: String, required: true },
      },
      required: true,
    },
    notice: {
      type: String,
      default: null,
    },
    types: {
      type: String,
      enum: ENUM_NOTIFICATION_TYPE,
      required: true,
    },
    admin: {
      type: Boolean,
    },
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
