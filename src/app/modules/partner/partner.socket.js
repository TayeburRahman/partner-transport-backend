const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const { ENUM_SOCKET_EVENT, ENUM_USER_ROLE } = require("../../../utils/enums");
const Services = require("../services/services.model");
// const Order = require("../order/order.model");
const Partner = require("./partner.model"); 

const handlePartnerData = async (receiverId, role, socket, io) => {

    // update Partner information of location 
    socket.on(ENUM_SOCKET_EVENT.PARTNER_LOCATION, async (data) => {

        const { latitude, longitude, address } = data; 
        console.log("====", latitude, longitude)

        if (!receiverId || !data?.longitude || !data?.latitude) { 
            socket.emit('error', {
                message: 'longitude or latitude not found',
            });
            return;
        }

        const updatedPartner = await Partner.findByIdAndUpdate(
            receiverId,
            { $set: { "location.coordinates": [Number(longitude), Number(latitude)] } },
            {
                new: true,
                runValidators: true,
                projection: { location: 1 },
            }
        );  

        if (!updatedPartner) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Partner not found!');
        }

        const { location } = updatedPartner;

        const services = await Services.find({
            confirmedPartner: receiverId,
            status: { $in: ["accepted", "rescheduled", "pick-up", "in-progress"] },
        });

        if (services && services?.length) {

            services.forEach(service => {
                const { _id, confirmedPartner } = service;
                const updateLocationPartner = {
                    partnerId: confirmedPartner,
                    serviceId: _id,
                    location,
                }
                const userId = service.user.toString();
                io.to(userId).emit(ENUM_SOCKET_EVENT.PARTNER_LOCATION, updateLocationPartner);
            });
        }
        io.to(receiverId.toString()).emit(ENUM_SOCKET_EVENT.PARTNER_LOCATION, location);
    },
    );

};

module.exports = {
    handlePartnerData,
}
