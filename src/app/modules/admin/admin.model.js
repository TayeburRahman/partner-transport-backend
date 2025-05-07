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
    accTo_dashboard_home: { type: Boolean, default: false },
    accTo_dashboard_home_edit: { type: Boolean, default: false },
    accTo_auction_manage: { type: Boolean, default: false },
    accTo_auction_edit: { type: Boolean, default: false },
    accTo_user_manage: { type: Boolean, default: false },
    accTo_user_manage_edit: { type: Boolean, default: false },
    accTo_partner_manage: { type: Boolean, default: false },
    accTo_partner_manage_edit: { type: Boolean, default: false },
    accTo_transaction: { type: Boolean, default: false },
    // accTo_transaction_edit: { type: Boolean, default: false },
    accTo_category_manage: { type: Boolean, default: false },
    accTo_category_manage_edit : { type: Boolean, default: false },
    accTo_review_conversation: { type: Boolean, default: false },
    // accTo_review_conversation_edit: { type: Boolean, default: false },
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
    accTo_notification_manage_edit: { type: Boolean, default: false },
    accTo_audit_dashboard: { type: Boolean, default: false },
    accTo_supervision_dashboard: { type: Boolean, default: false },
    accTo_activity_log: { type: Boolean, default: false },
    accTo_activity_log_edit: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Statics
const Admin = model("Admin", AdminSchema);

module.exports = Admin;
