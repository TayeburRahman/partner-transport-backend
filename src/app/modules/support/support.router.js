const express = require("express"); 
const auth = require("../../middlewares/auth");
const { uploadFile } = require("../../middlewares/fileUploader");
const { SupportController } = require("./support.collection");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
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
    SupportController.repliedTicket
  )
  .get(
    "/get-ticket",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN), 
    SupportController.getTicketDb
  )
  .get(
    "/get-ticket-details/:id",
    auth(ENUM_USER_ROLE.PARTNER, ENUM_USER_ROLE.USER), 
    SupportController.getTicketDetails
  )


   
   


  module.exports = router;