const express = require("express");
const router = express.Router();
const AuthRoutes = require("../modules/auth/auth.routes");
const AdminRoutes = require("../modules/admin/admin.routes");
const UserRoutes = require("../modules/user/user.routes");
const PartnerRoutes = require("../modules/partner/partner.routes");
const DashboardRoutes = require("../modules/dashboard/dashboard.routes");
const ServicesRoutes = require("../modules/services/services.routes");
const BidsRoutes = require("../modules/bid/bid.routes");
const CategoryRoutes = require("../modules/category/category.routes");
const MessageRoutes = require("../modules/message/message.routes");
const PaymentRoutes = require("../modules/payment/payment.routes");
const VariableRoutes = require("../modules/variable/variable.route");

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/dashboard",
    route: DashboardRoutes,
  },
  {
    path: "/partner",
    route: PartnerRoutes,
  },
  {
    path: "/services",
    route: ServicesRoutes,
  },
  {
    path: "/variables",
    route: VariableRoutes,
  },
  {
    path: "/bids",
    route: BidsRoutes,
  },
  {
    path: "/category",
    route: CategoryRoutes,
  },
  {
    path: "/message",
    route: MessageRoutes,
  },
  {
    path: "/payment",
    route: PaymentRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

module.exports = router;
