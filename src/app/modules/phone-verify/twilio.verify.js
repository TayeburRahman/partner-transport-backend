const twilio = require('twilio'); 
const config = require('../../../config');

// Validate Twilio credentials
if (!config.twilio?.account_sid || !config.twilio?.auth_token || !config.twilio?.phone_number) {
    throw new Error("Missing Twilio configuration. Check your config file.");
}

const client = twilio(config.twilio.account_sid, config.twilio.auth_token);

const isValidPhoneNumber = (phone) => /^\+\d{10,15}$/.test(phone);

const sendPhoneVerificationsMessage = async (message, phoneNumber) => {
    console.log("Twilio Config:", config.twilio.account_sid, config.twilio.auth_token);
    console.log("message", phoneNumber)

    // // Validate phone number
    // if (!isValidPhoneNumber(phoneNumber)) {
    //     return {
    //         invalid: true,
    //         message: "Invalid phone number format. Use E.164 format (e.g., +1234567890)."
    //     };
    // }

    try {
        const result = await client.messages.create({
            body: message,
            from: config.twilio.phone_number,
            to: '8801732917294'
        });

        console.log("Twilio Response:", result);

        return {
            invalid: false,
            message: `Message sent successfully to ${phoneNumber}`
        };
    } catch (error) {
        console.error("Twilio Error:", error);

        return {
            invalid: true,
            message: `Error sending message: ${error.message}`
        };
    }
};

module.exports = sendPhoneVerificationsMessage;
