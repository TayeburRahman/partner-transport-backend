
const express = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE } = require("../../../utils/enums"); 
const { LogsDashboardController } = require("./logsdashboard.collection.js");

const router = express.Router();

router
  .get(
    "/events-creation-rate",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    LogsDashboardController.eventsCreationRate
  )

  .get(
    "/most-created-users",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    LogsDashboardController.getMostCreatedUsers
  )

   

module.exports = router;


 