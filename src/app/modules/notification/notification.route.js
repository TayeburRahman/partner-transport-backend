const express = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE, ENUM_ADMIN_ACCESS } = require("../../../utils/enums");
const { notificationController } = require("./notificaiton.controller");
const checkAdminAccess = require("../../middlewares/checkAdminAccess");

const router = express.Router();

router.get(
  "/admin",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.DRIVER, ENUM_USER_ROLE.USER),
  checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_NOTIFICATION_MANAGE),
  notificationController.getAllNotification
);

module.exports = router;
