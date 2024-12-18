const express = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE, ENUM_ADMIN_ACCESS } = require("../../../utils/enums");
const { DashboardController } = require("./dashboard.controller");
const checkAdminAccess = require("../../middlewares/checkAdminAccess");
const { BidController } = require("../bid/bid.controller");

const router = express.Router();

router
  // home -----------------
  .get(
    "/total-counts",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.getTotalIncomeUserAuction
  )
  .get(
    "/income-overview",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.incomeOverview
  )
  .get(
    "/user-growth",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.getUserGrowth
  )
  
  // user ========================
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
  .get(
    "/get_all_user",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_USER_MANAGE),
    DashboardController.getAllUsers
  )

  // Partner ========================
  .get(
    "/get_all_partner",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_PARTNER_MANAGE, ENUM_ADMIN_ACCESS.ACC_TO_EDIT),
    DashboardController.getAllPartner
  )
  .get(
    "/get_padding_partner",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    // checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_PARTNER_MANAGE, ENUM_ADMIN_ACCESS.ACC_TO_EDIT),
    DashboardController.getPaddingPartner
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
    // checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_PARTNER_MANAGE),
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
    // checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_PARTNER_MANAGE, ENUM_ADMIN_ACCESS.ACC_TO_EDIT),
    DashboardController.addTermsConditions
  )
  .get("/get-terms-conditions", DashboardController.getTermsConditions)
  .delete(
    "/delete-terms-conditions",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    // checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_SETTINGS, ENUM_ADMIN_ACCESS.ACC_TO_EDIT),
    DashboardController.deleteTermsConditions
  )
  .post(
    "/add-privacy-policy",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    // checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_SETTINGS, ENUM_ADMIN_ACCESS.ACC_TO_EDIT),
    DashboardController.addPrivacyPolicy
  )
  .get("/get-privacy-policy", DashboardController.getPrivacyPolicy)
  .delete(
    "/delete-privacy-policy",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    // checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_SETTINGS, ENUM_ADMIN_ACCESS.ACC_TO_EDIT),
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
  .patch(
    "/search",
    // auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.filterAndSortServices
  )

  .post(
    "/notice/user",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.sendNoticeUsers
  )
  .post(
    "/notice/partner",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.sendNoticePartner
  )
  .get(
    '/transactions',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.getTransactionsHistory
  )
  .get(
    '/transaction/:id',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    DashboardController.getTransactionsDetails
  )

  // =File Claim================================
  .patch(
    "/status-file-claim",
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    // checkAdminAccess(ENUM_ADMIN_ACCESS.ACC_TO_FILE_CLAIM_MANAGE),
    BidController.updateStatusFileClaim
  )
  .patch(
    '/penalty',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    BidController.applyPenaltyPercent
  )
  .get(
    '/get-file-claim',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    BidController.getAllFileClaims
  )
// variable ========================


module.exports = router;
