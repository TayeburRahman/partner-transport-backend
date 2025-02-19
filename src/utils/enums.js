const ENUM_USER_ROLE = {
  USER: "USER",
  PARTNER: "PARTNER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
};

const ENUM_PARTNER_AC_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  DECLINED: "declined",
};

const ENUM_SOCKET_EVENT = {
  CONNECT: "connection",
  NOTIFICATION: "notification",
  NEW_NOTIFICATION: "new-notification",
  SEEN_NOTIFICATION: "seen-notification",
  MESSAGE_NEW: "new-message",
  MESSAGE_NEW_SERVICE: "new-message-service",
  MESSAGE_GETALL: "message",
  CONVERSION: "conversion",
  PARTNER_LOCATION: "partner-location",
  ACTIVE_ADMIN: "active-admin",
};

const ENUM_SERVICE_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  RESCHEDULED: "rescheduled",
  DECLINED: "declined",
  PICK_UP: "pick-up",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
  CANCEL: "cancel",
  CONFIRM_ARRIVED: "confirm-arrived",
  GOODS_LOADED: "goods-loaded",
  PARTNER_AT_DESTINATION: "partner-at-destination",
  DELIVERY_CONFIRMED: "delivery-confirmed",
  ARRIVED: "arrived",
  START_TRIP: "start-trip",
  ARRIVE_AT_DESTINATION: "arrive-at-destination",
  DELIVERED: "delivered",
};

const ENUM_SERVICE_TYPE = {
  GOODS: "Goods",
  WASTE: "Waste",
  SECOND_HAND_ITEMS: "Second-hand items",
  RECYCLABLE_MATERIALS: "Recyclable materials",
};

const ENUM_ADMIN_ACCESS = { 
  ACC_TO_DASHBOARD_HOME: "accTo_dashboard_home",
  ACC_TO_DASHBOARD_HOME_EDIT:"accTo_dashboard_home_edit",
  ACC_TO_AUCTION_MANAGE: "accTo_auction_manage",
  ACC_TO_AUCTION_EDIT: "accTo_auction_edit",
  ACC_TO_USER_MANAGE: "accTo_user_manage",
  ACC_TO_USER_EDIT: "accTo_user_manage_edit",
  ACC_TO_PARTNER_MANAGE: "accTo_partner_manage",
  ACC_TO_PARTNER_EDIT: "accTo_partner_manage_edit",
  ACC_TO_TRANSACTION: "accTo_transaction",
  ACC_TO_CATEGORY_MANAGE: "accTo_category_manage",
  ACC_TO_CATEGORY_EDIT: "accTo_category_manage_edit",
  ACC_TO_REVIEW_CONVERSATION: "accTo_review_conversation",
  ACC_TO_BANK_TRANSFER: "accTo_bank_transfer",
  ACC_TO_BANK_TRANSFER_EDIT: "accTo_bank_transfer_edit",
  ACC_TO_SUPPORT: "accTo_support",
  ACC_TO_SUPPORT_EDIT: "accTo_support_edit",
  ACC_TO_SETTINGS: "accTo_settings",
  ACC_TO_SETTINGS_EDIT: "accTo_settings_edit",
  ACC_TO_VARIABLE_MANAGE: "accTo_variable_manage",
  ACC_TO_VARIABLE_MANAGE_EDIT: "accTo_variable_manage_edit",
  ACC_TO_ADMIN_MANAGE: "accTo_admin_manage",
  ACC_TO_ADMIN_MANAGE_EDIT: "accTo_admin_manage_edit",
  ACC_TO_NOTIFICATIONS_MANAGE: "accTo_notifications_manage",
  ACC_TO_NOTIFICATIONS_EDIT: "accTo_notification_manage_edit",
  ACC_TO_AUDIT_DASHBOARD: "accTo_audit_dashboard",
  ACC_TO_SUPERVISION_DASHBOARD: "accTo_supervision_dashboard",
  ACC_TO_ACTIVITY_LOG: "accTo_activity_log",
}

const ENUM_NOTIFICATION_TYPE = {
  NEW_SERVICE: "service",
  NEW_MESSAGE: "new-message",
  NOTICE: "notice",
  TICKET: 'ticket',
  NONE: 'none',
  ONGOING: 'ongoing',
  COMPLETE_STATUS:"complete-status"
};
const ENUM_PAYMENT_STATUS = {};


module.exports = {
  ENUM_USER_ROLE,
  ENUM_PARTNER_AC_STATUS,
  ENUM_SOCKET_EVENT,
  ENUM_SERVICE_STATUS,
  ENUM_SERVICE_TYPE,
  ENUM_PAYMENT_STATUS,
  ENUM_ADMIN_ACCESS,
  ENUM_NOTIFICATION_TYPE
};
