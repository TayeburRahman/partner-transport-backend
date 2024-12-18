const express = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const { uploadFile } = require("../../middlewares/fileUploader"); 
const { VariableController } = require("./variable.controller");

const router = express.Router();

router 
  .post(
    "/create",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    uploadFile(),
    VariableController.createVariable
  )
  .patch(
    "/update",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    VariableController.updateVariable
  )
  .get(
    "/find", 
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
    VariableController.changeContactNumber
  ) 

  .get(
    "/contact-number",  
    VariableController.getContactNumber
  ) 
  
   

   

module.exports = router;
