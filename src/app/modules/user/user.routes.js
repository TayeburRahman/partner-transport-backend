const express = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const { uploadFile } = require("../../middlewares/fileUploader");
const { UserController } = require("./user.controller");

const router = express.Router();

router
  .get("/profile", auth(ENUM_USER_ROLE.USER), UserController.getProfile)
  .patch(
    "/edit-profile",
    auth(ENUM_USER_ROLE.USER),
    uploadFile(),
    UserController.updateProfile
  )
  .delete(
    "/delete-account",
    auth(ENUM_USER_ROLE.USER),
    UserController.deleteMyAccount
  );

module.exports = router;
