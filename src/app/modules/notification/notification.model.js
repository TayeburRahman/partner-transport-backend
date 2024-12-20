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
     userType: {
      type: String, 
      enum: ['User', 'Partner', 'Admin'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    admin_ms: {
      type: Boolean,
      required: false,
    },
    message: {
      type: String,
      required: true,
    },
    notice:{
      type: String,
      default: null,
    },
    types: {
      type: String,
      enum: ENUM_NOTIFICATION_TYPE,
      required: true,
    },
    admin:{
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
