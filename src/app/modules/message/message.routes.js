const express = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const { MessageController } = require("./message.controller");

const router = express.Router();

router
  .get(
    "/get-conversation",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    MessageController.conversationUser
  )
  .get(
    "/get-message",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    MessageController.getMessages
  );


module.exports = router;
