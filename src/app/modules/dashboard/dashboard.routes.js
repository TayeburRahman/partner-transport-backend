const express = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE, ENUM_ADMIN_ACCESS } = require("../../../utils/enums");
const { DashboardController } = require("./dashboard.controller");
const checkAdminAccess = require("../../middlewares/checkAdminAccess");

const router = express.Router();

// user ========================
router
  .get(
    "/get_all_user",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_USER_MANAGE),
    DashboardController.getAllUsers
  )
  .get(
    "/get_user_details",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.getUserDetails
  )
  .delete(
    "/delete_user",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_USER_MANAGE, ENUM_ADMIN_ACCESS.ACC_TO_EDIT),
    DashboardController.deleteUser
  )

  // Partner ========================
  .get(
    "/get_all_partner",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_PARTNER_MANAGE),
    DashboardController.getAllPartner
  )
  .get(
    "/get_partner_details",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.getPartnerDetails
  )
  .delete(
    "/delete_partner",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_PARTNER_MANAGE, ENUM_ADMIN_ACCESS.ACC_TO_EDIT),
    DashboardController.deletePartner
  )
  .get(
    "/get_pending_partners",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_PARTNER_MANAGE),
    DashboardController.getAllPendingPartners
  )
  .patch(
    "/approve_decline_partner",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_PARTNER_MANAGE, ENUM_ADMIN_ACCESS.ACC_TO_EDIT),
    DashboardController.approveDeclinePartner
  )

  // Admin ========================
  .get(
    "/get_all_admin",
    auth(ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.getAllAdmins
  )
  .get(
    "/get_admin_details",
    auth(ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.getAdminDetails
  )
  .delete(
    "/delete_admin",
    auth(ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.deleteAdmin
  )

  // Common ========================
  .patch(
    "/block-unblock-user-partner-admin",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_PARTNER_MANAGE,
       ENUM_ADMIN_ACCESS.ACC_TO_USER_MANAGE, 
       ENUM_ADMIN_ACCESS.ACC_TO_ADMIN_MANAGE,  
       ENUM_ADMIN_ACCESS.ACC_TO_EDIT),
    DashboardController.blockUnblockUserPartnerAdmin
  )

  // Manage ========================
  .post(
    "/add-terms-conditions",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_PARTNER_MANAGE, ENUM_ADMIN_ACCESS.ACC_TO_EDIT),
    DashboardController.addTermsConditions
  )
  .get("/get-terms-conditions", DashboardController.getTermsConditions)
  .delete(
    "/delete-terms-conditions",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_SETTINGS, ENUM_ADMIN_ACCESS.ACC_TO_EDIT),
    DashboardController.deleteTermsConditions
  )
  .post(
    "/add-privacy-policy",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_SETTINGS, ENUM_ADMIN_ACCESS.ACC_TO_EDIT),
    DashboardController.addPrivacyPolicy
  )
  .get("/get-privacy-policy", DashboardController.getPrivacyPolicy)
  .delete(
    "/delete-privacy-policy",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_SETTINGS, ENUM_ADMIN_ACCESS.ACC_TO_EDIT),
    DashboardController.deletePrivacyPolicy
  )

  // Auction Management ========================
  .get(
    "/get-all-auction",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_AUCTION_MANAGE),
    DashboardController.getAllAuctions
  )
  .patch(
    "/edit-min-max-bid-amount",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_VARIABLE_MANAGE, ENUM_ADMIN_ACCESS.ACC_TO_EDIT),
    DashboardController.editMinMaxBidAmount
  )

  // overview ========================
  .get(
    "/total-overview",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.totalOverview
  )
  .get(
    "/user-partner-growth",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.getMonthlyRegistrations
  )
  .get(
    "/search",
    // auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.filterAndSortServices
  )

  // variable ========================
 

module.exports = router;
