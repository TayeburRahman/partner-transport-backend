const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const { ENUM_SOCKET_EVENT, ENUM_USER_ROLE } = require("../../../utils/enums");
const Services = require("../services/services.model");
const Partner = require("./partner.model");

const handlePartnerData = async (receiverId, role, socket, io) => {
  // update Partner information of location
  socket.on(ENUM_SOCKET_EVENT.PARTNER_LOCATION, async (data) => {
    try {
      const { latitude, longitude, address } = data || {};

      if (!receiverId || !longitude || !latitude) {
        return socket.emit("error", {
          status: httpStatus.BAD_REQUEST,
          message: "longitude or latitude not found",
        });
      }

      const updatedPartner = await Partner.findByIdAndUpdate(
        receiverId,
        {
          $set: {
            "location.coordinates": [Number(longitude), Number(latitude)],
            ...(address && { "location.address": address }), // optional address update
          },
        },
        {
          new: true,
          runValidators: true,
          projection: { location: 1 },
        }
      );

      if (!updatedPartner) {
        return socket.emit("error", {
          status: httpStatus.NOT_FOUND,
          message: "Partner not found!",
        });
      }

      const { location } = updatedPartner;

      // find active services linked to this partner
      const services = await Services.find({
        confirmedPartner: receiverId,
        status: { $in: ["accepted", "rescheduled", "pick-up", "in-progress"] },
      });

      console.log("Emitting partner location to partner himself:", receiverId.toString());

      io.emit(
       `${ENUM_SOCKET_EVENT.PARTNER_LOCATION}/${receiverId}`,
       location
     );

      // also send back to the partner himself
      io.to(receiverId.toString()).emit(
        ENUM_SOCKET_EVENT.PARTNER_LOCATION,
        location
      );
    } catch (error) {
      console.error("Socket error (PARTNER_LOCATION):", error);

      socket.emit("error", {
        status: error.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || "Something went wrong while updating partner location",
      });
    }
  });
};

module.exports = {
  handlePartnerData,
};
