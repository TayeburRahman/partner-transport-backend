const express = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE, ENUM_ADMIN_ACCESS } = require("../../../utils/enums");
const { CategoryController } = require("./category.controller");
const checkAdminAccess = require("../../middlewares/checkAdminAccess");

const router = express.Router();

router
  .post(
    "/create-category",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_CATEGORY_MANAGE, ENUM_ADMIN_ACCESS.ACC_TO_EDIT),
    CategoryController.createCategory
  )
  .patch(
    "/update-category",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_CATEGORY_MANAGE, ENUM_ADMIN_ACCESS.ACC_TO_EDIT),
    CategoryController.updateCategory
  )
  .delete(
    "/delete-category",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_CATEGORY_MANAGE, ENUM_ADMIN_ACCESS.ACC_TO_EDIT),
    CategoryController.deleteCategory
  )
  .get(
    "/get-all-category",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    CategoryController.getAllCategory
  );

module.exports = router;
