const express = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE, ENUM_ADMIN_ACCESS } = require("../../../utils/enums");
const { notificationController } = require("./notificaiton.controller");
const checkAdminAccess = require("../../middlewares/checkAdminAccess");

const router = express.Router();


router.get(
  "/get-notice/:id",
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.PARTNER),
  notificationController.getNoticeNotification
);

router.get(
  "/get-user-partner",
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.PARTNER),
  notificationController.getUserNotification
);

router.get(
  "/admin",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  // checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_NOTIFICATION_MANAGE),
  notificationController.getAdminNotification
);

router.delete(
  "/admin-delete/:id",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  // checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_NOTIFICATION_MANAGE),
  notificationController.deleteAdminNotification
);

module.exports = router;
