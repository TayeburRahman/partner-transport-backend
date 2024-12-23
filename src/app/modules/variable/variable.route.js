const express = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE, ENUM_ADMIN_ACCESS } = require("../../../utils/enums");
const { uploadFile } = require("../../middlewares/fileUploader"); 
const { VariableController } = require("./variable.controller");
const checkAdminAccess = require("../../middlewares/checkAdminAccess");

const router = express.Router();

router 
  .post(
    "/create",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_VARIABLE_MANAGE),
    uploadFile(),
    VariableController.createVariable
  )
  .patch(
    "/update",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_VARIABLE_MANAGE_EDIT),
    VariableController.updateVariable
  )
  .get(
    "/find", 
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_VARIABLE_MANAGE_EDIT),
    VariableController.getVariable
  )
  .post(
    "/dollar_to_peso", 
    VariableController.convertDollarToPeso
  )
  .post(
    "/peso_to_dollar", 
    VariableController.convertPesoToDollar
  )  
  .post(
    "/contact-number", 
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN), 
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_SETTINGS_EDIT),
    VariableController.changeContactNumber
  )  
  .get(
    "/contact-number",  
    VariableController.getContactNumber
  ) 
  
   

   

module.exports = router;
