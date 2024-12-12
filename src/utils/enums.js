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
  MESSAGE_GETALL: "message",
  CONVERSION: "conversion", 
  PARTNER_LOCATION: "partner-location",  
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
  CONFIRM_ARRIVED:"confirm-arrived",
  GOODS_LOADED:"goods-loaded",
  PARTNER_AT_DESTINATION:"partner-at-destination",
  DELIVERY_CONFIRMED:"delivery-confirmed",
  ARRIVED:"arrived",
  START_TRIP:"start-trip",
  ARRIVE_AT_DESTINATION:"arrive-at-destination",
  DELIVERED:"delivered", 
};

const ENUM_SERVICE_TYPE = {
  GOODS: "Goods",
  WASTE: "Waste",
  SECOND_HAND_ITEMS: "Second-hand items",
  RECYCLABLE_MATERIALS: "Recyclable materials",
};

const ENUM_ADMIN_ACCESS = {
  ACC_TO_AUCTION_MANAGE: "accTo_auction_manage",
  ACC_TO_USER_MANAGE: "accTo_user_manage",
  ACC_TO_PARTNER_MANAGE: "accTo_partner_manage",
  ACC_TO_TRANSACTION: "accTo_transaction",
  ACC_TO_CATEGORY_MANAGE: "accTo_category_manage",
  ACC_TO_REVIEW_CONVERSATION: "accTo_review_conversation",
  ACC_TO_BANK_TRANSFER: "accTo_bank_transfer",
  ACC_TO_VARIABLE_MANAGE: "accTo_variable_manage", //
  ACC_TO_SUPPORT: "accTo_support",
  ACC_TO_SETTINGS: "accTo_settings",
  ACC_TO_EDIT: "accTo_editor",//
  ACC_TO_ADMIN_MANAGE: "accTo_admin_manage",//
  ACC_TO_NOTIFICATION_MANAGE: "accTo_notifications_manage",//
  ACC_TO_AUDIT: "accTo_audit",//
  ACC_TO_TERMS_CONDITIONS: "accTo_terms&conditions",//
  ACC_TO_PRIVACY_POLICY: "accTo_privacyPolicy",//
};

const ENUM_NOTIFICATION_TYPE = {
  NEW_SERVICE: "service",
  NEW_MESSAGE: "new-message",   
  NOTICE: "notice", 
  TICKET: 'ticket',
   NONE: 'none'
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
