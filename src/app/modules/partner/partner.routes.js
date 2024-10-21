const express = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const { uploadFile } = require("../../middlewares/fileUploader");
const { PartnerController } = require("./partner.controller");

const router = express.Router();

router
  .get("/profile", auth(ENUM_USER_ROLE.PARTNER), PartnerController.getProfile)
  .patch(
    "/edit-profile",
    auth(ENUM_USER_ROLE.PARTNER),
    uploadFile(),
    PartnerController.updateProfile
  )
  .delete(
    "/delete-account",
    auth(ENUM_USER_ROLE.PARTNER),
    PartnerController.deleteMyAccount
  );

module.exports = router;
