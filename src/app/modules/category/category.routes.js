const express = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const { CategoryController } = require("./category.controller");

const router = express.Router();

router
  .post(
    "/create-category",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    CategoryController.createCategory
  )
  .patch(
    "/update-category",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    CategoryController.updateCategory
  )
  .delete(
    "/delete-category",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    CategoryController.deleteCategory
  )
  .get(
    "/get-all-category",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    CategoryController.getAllCategory
  );

module.exports = router;
