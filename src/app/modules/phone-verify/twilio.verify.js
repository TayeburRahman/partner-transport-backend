const twilio = require('twilio');
const config = require('../../../config');
const Auth = require('../auth/auth.model');
const ApiError = require('../../../errors/ApiError');
const User = require('../user/user.model');
const { ENUM_USER_ROLE } = require('../../../utils/enums');
const Partner = require('../partner/partner.model');
let client;
if (config.twilio.api_key_sid && config.twilio.api_key_secret) {
    client = twilio(config.twilio.api_key_sid, config.twilio.api_key_secret, { accountSid: config.twilio.account_sid });
} else {
    client = twilio(config.twilio.account_sid, config.twilio.auth_token);
}

const isValidPhoneNumber = (phone) => /^\+\d{10,15}$/.test(phone);

const sendPhoneVerificationsMessage = async (message, phoneNumber, verifyOtp, user, countryCode, phone) => {
    // If phone number doesn't start with +, format with countryCode to ensure E.164 format
    let formattedPhoneNumber = phoneNumber;
    if (typeof phoneNumber === 'string' && !phoneNumber.startsWith('+') && countryCode) {
        const cleanCC = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
        const cleanPhone = phoneNumber.replace(/^0/, '');
        formattedPhoneNumber = `${cleanCC}${cleanPhone}`;
    }

    if (!isValidPhoneNumber(formattedPhoneNumber)) {
        return {
            invalid: true,
            message: "Invalid phone number format. Use E.164 format (e.g., +1234567890)."
        };
    }

    try {
        // Save OTP to Auth database first so user can test even if SMS service fails
        const update = await Auth.findByIdAndUpdate(user.authId, { verifyOtp });
        if (!update) {
            throw new ApiError(404, "Error updating verify code in the database. Please try again!");
        }

        if (user.role === ENUM_USER_ROLE.USER) {
            await User.findByIdAndUpdate(user.userId, { phone_number: phone, phone_c_code: countryCode });
        } else if (user.role === ENUM_USER_ROLE.PARTNER) {
            await Partner.findByIdAndUpdate(user.userId, { phone_number: phone, phone_c_code: countryCode });
        }

        console.log(`\n========================================`);
        console.log(`[OTP GENERATED] Phone: ${formattedPhoneNumber} | OTP: ${verifyOtp}`);
        console.log(`========================================\n`);

        if (config.twilio.verify_service_sid) {
            // Send SMS via Twilio Verify Service (VA...) - no FROM phone number needed!
            await client.verify.v2
                .services(config.twilio.verify_service_sid)
                .verifications
                .create({ to: formattedPhoneNumber, channel: 'sms' });
        } else {
            // Fallback to Programmable SMS with from phone_number
            await client.messages.create({
                body: message,
                from: config.twilio.phone_number,
                to: formattedPhoneNumber
            });
        }

        return {
            invalid: false,
            message: `Message sent successfully to ${formattedPhoneNumber}`
        };
    } catch (error) {
        console.error("Twilio SMS sending error:", error.message);
        throw new ApiError(400, error.message);
    }
};

module.exports = sendPhoneVerificationsMessage;
