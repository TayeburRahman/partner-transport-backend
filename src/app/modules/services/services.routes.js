const express = require("express");
const { ServicesController } = require("./services.controller");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const { uploadFile } = require("../../middlewares/fileUploader");
const { BidController } = require("../bid/bid.controller");

const router = express.Router();

router
  .post(
    "/create",
    auth(ENUM_USER_ROLE.USER),
    uploadFile(),
    ServicesController.createPostDB
  )
  .patch(
    "/update/:serviceId",
    auth(ENUM_USER_ROLE.USER),
    uploadFile(),
    ServicesController.updatePostDB
  )
  .get("/details/:serviceId", ServicesController.getDetails)
  .get(
    "/user_history",
    auth(ENUM_USER_ROLE.USER),
    ServicesController.getUserPostHistory
  )
  .get(
    "/history/filter",
    auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN),
    ServicesController.filterUserByHistory
  )
  .delete(
    "/delete/:serviceId",
    auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN),
    ServicesController.deletePostDB
  )
  .patch(
    "/conform_partner",
    auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN),
    ServicesController.conformPartner
  )
  .get(
    "/get_post_user",
    auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN),
    ServicesController.getServicePostUser
  )
  .patch(
    "/rescheduled/:serviceId",
    auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN),
    ServicesController.rescheduledPostUser
  )
  .get(
    "/search_nearby",
    auth(ENUM_USER_ROLE.PARTNER),
    ServicesController.searchNearby
  )
  .patch(
    "/rescheduled_partner",
    auth(ENUM_USER_ROLE.PARTNER),
    ServicesController.rescheduledAction
  )
  .patch(
    "/update-status-users",
    auth(ENUM_USER_ROLE.USER),
    ServicesController.updateServicesStatusUser
  )
  .patch(
    "/update-status-partner",
    auth(ENUM_USER_ROLE.PARTNER),
    ServicesController.updateServicesStatusPartner
  )
  .get(
    "/user/within_one_hour",
    auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.PARTNER),
    ServicesController.getUserServicesWithinOneHour
  )
  .post("/review",
    auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.PARTNER),
   BidController.postReviewMove)

  .get(
    "/review-partner",
    auth(ENUM_USER_ROLE.PARTNER, ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN),
    BidController.getPartnerReviews
  )
  .get(
    "/order-details",
    auth(ENUM_USER_ROLE.PARTNER, ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN),
    BidController.orderDetailsPageFileClaim
  )
  .get(
    "/status-details",
    auth(ENUM_USER_ROLE.PARTNER, ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN),
    BidController.statusServicesDetails
  )
  .post(
    "/create-file-claim",
    uploadFile(),
    auth(ENUM_USER_ROLE.PARTNER, ENUM_USER_ROLE.USER),
    BidController.createFileClaim
  );

module.exports = router;
