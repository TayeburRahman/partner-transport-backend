const auth = require("../../middlewares/auth");
const express = require("express");
const { ENUM_USER_ROLE, ENUM_ADMIN_ACCESS } = require("../../../utils/enums");
const { uploadFile } = require("../../middlewares/fileUploader");
const { AdminController } = require("../admin/admin.controller");
const checkAdminAccess = require("../../middlewares/checkAdminAccess");

const router = express.Router();

router
  .get(
    "/profile",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    AdminController.myProfile
  )
  .patch(
    "/edit-profile",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    uploadFile(),
    AdminController.updateProfile
  )
  .delete(
    "/delete_account",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    AdminController.deleteMyAccount
  )
  .get(
    "/get-all",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_ACTIVITY_LOG),
    AdminController.getAllAdmin
  );

module.exports = router;
