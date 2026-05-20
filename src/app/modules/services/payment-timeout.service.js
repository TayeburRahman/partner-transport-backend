const Services = require("./services.model");
const Partner = require("../partner/partner.model");
const User = require("../user/user.model");
const Notification = require("../notification/notification.model");
const { NotificationService } = require("../notification/notification.service");

// Check for unpaid services after 1 hour
const checkPaymentTimeout = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

    // Find services where:
    // - Payment is pending
    // - Service was confirmed more than 1 hour ago
    // - Payment hasn't been processed
    const expiredServices = await Services.find({
      confirmedAt: {
        $lt: oneHourAgo,
        $ne: null,
      },
      paymentStatus: "pending",
      status: { $in: ["pending", "accepted"] },
    }).populate("user confirmedPartner");

    if (expiredServices.length === 0) {
      console.log("[Payment Timeout] No expired unpaid services found.");
      return;
    }

    console.log(`[Payment Timeout] Found ${expiredServices.length} expired unpaid services.`);

    for (const service of expiredServices) {
      // Send notification to user
      await sendPaymentTimeoutNotification(service);

      // Reset the service to accept other offers
      await resetServiceForOtherOffers(service);
    }
  } catch (error) {
    console.error("[Payment Timeout] Error checking payment timeout:", error.message);
  }
};

// Send notification to user about payment timeout
const sendPaymentTimeoutNotification = async (service) => {
  try {
    const partnerName = service.confirmedPartner?.name || "Partner";

    await NotificationService.sendNotification({
      title: {
        eng: "Payment Timeout - Offer Cancelled",
        span: "Tiempo de pago agotado - Oferta cancelada",
      },
      message: {
        eng: `${partnerName} did not complete payment within 1 hour. You can now accept other offers.`,
        span: `${partnerName} no completó el pago dentro de 1 hora. Ahora puede aceptar otras ofertas.`,
      },
      user: service.user._id,
      userType: "User",
      getId: service._id,
      types: "payment_timeout",
      status: "unread",
    });

    console.log(`[Payment Timeout] Notification sent to user ${service.user._id} for service ${service._id}`);
  } catch (error) {
    console.error("[Payment Timeout] Error sending notification:", error.message);
  }
};

// Reset service to accept other partner offers
const resetServiceForOtherOffers = async (service) => {
  try {
    await Services.findByIdAndUpdate(
      service._id,
      {
        confirmedPartner: null,
        confirmedAt: null,
        paymentStatus: "pending",
        status: "pending", // Reset to pending so other partners can bid
        transactionId: null,
      },
      { new: true, runValidators: true }
    );

    console.log(
      `[Payment Timeout] Service ${service._id} reset to accept other offers`
    );

    // Notify the failed partner (optional)
    await notifyPartnerPaymentFailed(service.confirmedPartner._id, service);
  } catch (error) {
    console.error("[Payment Timeout] Error resetting service:", error.message);
  }
};

// Notify partner about payment failure
const notifyPartnerPaymentFailed = async (partnerId, service) => {
  try {
    const partnerNotification = new Notification({
      title: {
        eng: "Payment Failed - Offer Lost",
        span: "Pago fallido - Oferta perdida",
      },
      message: {
        eng: "Your payment was not completed within the time limit. The offer has been cancelled.",
        span: "Tu pago no se completó en el tiempo límite. La oferta ha sido cancelada.",
      },
      user: partnerId,
      userType: "Partner",
      getId: service._id,
      types: "payment_failed",
      status: "unread",
    });

    await partnerNotification.save();
    console.log(`[Payment Timeout] Partner ${partnerId} notified of payment failure`);
  } catch (error) {
    console.error("[Payment Timeout] Error notifying partner:", error.message);
  }
};

// Start interval checker (runs every 5 minutes)
const startPaymentTimeoutChecker = () => {
  console.log("[Payment Timeout] Starting payment timeout checker...");
  
  // Run immediately on startup
  checkPaymentTimeout();

  // Then run every 5 minutes
  const intervalId = setInterval(() => {
    checkPaymentTimeout();
  }, 5 * 60 * 1000); // 5 minutes

  return intervalId;
};

module.exports = {
  checkPaymentTimeout,
  startPaymentTimeoutChecker,
  sendPaymentTimeoutNotification,
  resetServiceForOtherOffers,
};
