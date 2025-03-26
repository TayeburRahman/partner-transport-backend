const express = require("express"); 
const auth = require("../../middlewares/auth");
const { uploadFile } = require("../../middlewares/fileUploader");
const { SupportController } = require("./support.collection");
const { ENUM_USER_ROLE, ENUM_ADMIN_ACCESS } = require("../../../utils/enums");
const checkAdminAccess = require("../../middlewares/checkAdminAccess");
const router = express.Router();

router
  .post(
    "/create-ticket",
    auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.PARTNER),  
    SupportController.createTicket
  )
  .patch(
    "/reply-ticket/:ticketId",
    auth( ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),  
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_SUPPORT_EDIT),
    SupportController.repliedTicket
  )
  .get(
    "/get-ticket",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN), 
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_SUPPORT),
    SupportController.getTicketDb
  )
  .get(
    "/get-ticket-details/:id",
    auth(ENUM_USER_ROLE.PARTNER, ENUM_USER_ROLE.USER), 
    // checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_SUPPORT),
    SupportController.getTicketDetails
  )


   
   


  module.exports = router;