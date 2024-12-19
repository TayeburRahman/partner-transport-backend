
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
  .get(
    "/most-admin-tasks",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    LogsDashboardController.getAdminTaskCompted
  ) 
  .get(
    "/get-activity-log",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    LogsDashboardController.getActivityLog
  )
  .get(
    "/get-task-completed",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    LogsDashboardController.getTaskCompleted
  )
  .get(
    "/get-task-counts",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    LogsDashboardController.getTaskSummary
  ) 
   
   

module.exports = router;


 