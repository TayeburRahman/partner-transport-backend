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

const ENUM_PAYMENT_STATUS = {};

 
module.exports = {
  ENUM_USER_ROLE,
  ENUM_PARTNER_AC_STATUS,
  ENUM_SOCKET_EVENT,
  ENUM_SERVICE_STATUS,
  ENUM_SERVICE_TYPE,
  ENUM_PAYMENT_STATUS,
};
