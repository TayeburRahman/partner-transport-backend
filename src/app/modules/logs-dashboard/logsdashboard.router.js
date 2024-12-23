
const express = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE, ENUM_ADMIN_ACCESS } = require("../../../utils/enums"); 
const { LogsDashboardController } = require("./logsdashboard.collection.js");
const checkAdminAccess = require("../../middlewares/checkAdminAccess.js");

const router = express.Router();

router
  .get(
    "/events-creation-rate",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_AUDIT_DASHBOARD),
    LogsDashboardController.eventsCreationRate
  ) 
  .get(
    "/most-created-users",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_AUDIT_DASHBOARD),
    LogsDashboardController.getMostCreatedUsers
  )
  .get(
    "/most-admin-tasks",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_AUDIT_DASHBOARD),
    LogsDashboardController.getAdminTaskCompted
  ) 
  .get(
    "/get-activity-log",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_ACTIVITY_LOG),
    LogsDashboardController.getActivityLog
  )
  .get(
    "/get-task-completed",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_SUPERVISION_DASHBOARD),
    LogsDashboardController.getTaskCompleted
  )
  .get(
    "/get-task-counts",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_SUPERVISION_DASHBOARD),
    LogsDashboardController.getTaskSummary
  ) 
   
   

module.exports = router;


 