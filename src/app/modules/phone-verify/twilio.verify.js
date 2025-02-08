const twilio = require('twilio');
const config = require('../../../config');
const Auth = require('../auth/auth.model');
const ApiError = require('../../../errors/ApiError');
const User = require('../user/user.model');
const { ENUM_USER_ROLE } = require('../../../utils/enums');
const Partner = require('../partner/partner.model');
const client = twilio(config.twilio.account_sid, config.twilio.auth_token);

const isValidPhoneNumber = (phone) => /^\+\d{10,15}$/.test(phone);

const sendPhoneVerificationsMessage = async (message, phoneNumber, verifyOtp, user, countryCode, phone) => {
    // console.log("message", message, phoneNumber )

    if (!isValidPhoneNumber(phoneNumber)) {
        return {
            invalid: true,
            message: "Invalid phone number format. Use E.164 format (e.g., +1234567890)."
        };
    }
    console.log("phoneNumber", phoneNumber, user)
    console.log("Twilio SID:", config.twilio.account_sid);
    console.log("Twilio Auth Token:", config.twilio.auth_token);
    console.log("Twilio From Number:", config.twilio.phone_number);


    try {
        const result = await client.messages.create({
            body: message,
            from: config.twilio.phone_number,
            to: phoneNumber
        });
        console.log("result", result)

        if (result) {
            const update = await Auth.findByIdAndUpdate(user.authId, { verifyOtp })
            if (!update) {
                throw new ApiError(404, "Error updating verify code in the database. Please try again!")
            }

            let result
            if (user.role === ENUM_USER_ROLE.USER) {
                result = await User.findByIdAndUpdate(user.userId, { phone_number: phone, phone_c_code: countryCode })
            } else if (user.role === ENUM_USER_ROLE.PARTNER) {
                result = await Partner.findByIdAndUpdate(user.userId, { phone_number: phone, phone_c_code: countryCode })
            }

            if (!result) {
                throw new ApiError(404, "Error updating verify code in the database. Please try again!")
            }
        }

        console.log("result", result)

        return {
            invalid: false,
            message: `Message sent successfully to ${phoneNumber}`
        };
    } catch (error) {
        throw new ApiError(404, error.message)
    }
};

module.exports = sendPhoneVerificationsMessage;
