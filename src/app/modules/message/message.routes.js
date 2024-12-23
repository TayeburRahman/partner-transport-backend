const express = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE, ENUM_ADMIN_ACCESS } = require("../../../utils/enums");
const { MessageController } = require("./message.controller");
const checkAdminAccess = require("../../middlewares/checkAdminAccess");

const router = express.Router();

router
  .get(
    "/get-conversation",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_REVIEW_CONVERSATION),
    MessageController.conversationUser
  )
  .get(
    "/get-message",
    auth( ENUM_USER_ROLE.PARTNER, ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    MessageController.getMessages
  );


module.exports = router;
