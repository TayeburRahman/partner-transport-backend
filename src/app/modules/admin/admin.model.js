const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const AdminSchema = new Schema(
  {
    authId: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "Auth",
    },
    name: {
      type: String,
      required: true,
    }, 
    email: {
      type: String,
      required: true,
    },
    profile_image: {
      type: String,
      default: null,
    },
    phone_number: {
      type: String, 
    },
    address: {
      type: String,
      default: null,
    },
    location: {
      type: String,
      default: null,
    },
    date_of_birth: {
      type: String,
      default: null,
    },
    accTo_auction_manage: { type: Boolean, default: false },
    accTo_auction_edit: { type: Boolean, default: false },
    accTo_user_manage: { type: Boolean, default: false },
    accTo_user_edit: { type: Boolean, default: false },
    accTo_partner_manage: { type: Boolean, default: false },
    accTo_partner_edit: { type: Boolean, default: false },
    accTo_transaction: { type: Boolean, default: false },
    accTo_transaction_edit: { type: Boolean, default: false },
    accTo_category_manage: { type: Boolean, default: false },
    accTo_category_edit: { type: Boolean, default: false },
    accTo_review_conversation: { type: Boolean, default: false },
    accTo_review_conversation_edit: { type: Boolean, default: false },
    accTo_bank_transfer: { type: Boolean, default: false },
    accTo_bank_transfer_edit: { type: Boolean, default: false },
    accTo_support: { type: Boolean, default: false },
    accTo_support_edit: { type: Boolean, default: false },
    accTo_settings: { type: Boolean, default: false },
    accTo_settings_edit: { type: Boolean, default: false },
    accTo_variable_manage: { type: Boolean, default: false },
    accTo_variable_manage_edit: { type: Boolean, default: false },
    accTo_admin_manage: { type: Boolean, default: false },
    accTo_admin_manage_edit: { type: Boolean, default: false },
    accTo_notifications_manage: { type: Boolean, default: false },
    accTo_notifications_edit: { type: Boolean, default: false },
    accTo_audit_dashboard: { type: Boolean, default: false },
    accTo_supervision_dashboard: { type: Boolean, default: false },
    accTo_activity_log: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// const ENUM_ADMIN_ACCESS = {
//   ACC_TO_AUCTION_MANAGE: "accTo_auction_manage",
//   ACC_TO_USER_MANAGE: "accTo_user_manage",
//   ACC_TO_PARTNER_MANAGE: "accTo_partner_manage",
//   ACC_TO_TRANSACTION: "accTo_transaction",
//   ACC_TO_CATEGORY_MANAGE: "accTo_category_manage",
//   ACC_TO_REVIEW_CONVERSATION: "accTo_review_conversation",
//   ACC_TO_BANK_TRANSFER: "accTo_bank_transfer",
//   ACC_TO_VARIABLE_MANAGE: "accTo_variable_manage", //
//   ACC_TO_SUPPORT: "accTo_support",
//   ACC_TO_SETTINGS: "accTo_settings",
//   ACC_TO_EDIT: "accTo_editor",//
//   ACC_TO_ADMIN_MANAGE: "accTo_admin_manage",//
//   ACC_TO_NOTIFICATION_MANAGE: "accTo_notifications_manage",//
// };

// Statics
const Admin = model("Admin", AdminSchema);

module.exports = Admin;
