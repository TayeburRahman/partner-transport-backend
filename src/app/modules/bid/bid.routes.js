const express = require("express");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const { BidController } = require("./bid.controller");
const auth = require("../../middlewares/auth");
const router = express.Router();

router
  .patch(
    "/post/:serviceId",
    auth(ENUM_USER_ROLE.PARTNER),
    BidController.partnerBidPost
  )
  .get(
    "/get_by_partner",
    auth(ENUM_USER_ROLE.PARTNER, ENUM_USER_ROLE.ADMIN),
    BidController.partnerAllBids
  ) 
  .get(
    "/move/filter",
    auth(ENUM_USER_ROLE.PARTNER, ENUM_USER_ROLE.ADMIN),
    BidController.filterBidsByMove
  )
  .patch(
    "/history/filter",
    auth(ENUM_USER_ROLE.PARTNER, ENUM_USER_ROLE.ADMIN),
    BidController.filterBidsByHistory
  )  

  .get(
    "/partner-profile",
    auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.PARTNER),
    BidController.getBitProfilePartner
  )  

   
   

   

module.exports = router;
