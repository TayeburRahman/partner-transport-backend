const mongoose = require('mongoose');
const { Schema } = mongoose;
const { ObjectId } = Schema.Types;


const transactionSchema = new Schema({
    serviceId: {
        type: ObjectId,
        ref: "Services",
        required: true,
    },
    userId: {
        type: ObjectId,
        ref: "User",
        required: true,
    },
    partnerId: {
        type: ObjectId,
        ref: "Partner",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ["Stripe", "PayPal", "ApplePay", "GooglePay"],
        required: true,
    },
    transactionId: {
        type: String,
        trim: true, 
        required: true, 
    },
    paymentStatus: {
        type: String,
        enum: ["Completed", "Pending", "Failed","Refunded"],
        required: true,
    },
    paymentDetails: {
        email: {
            type: String, 
        },
        payId: {
            type: String,
            required: true,
        },
        currency: {
            type: String,
            default: "USD",
        },
    },
}, { timestamps: true });



const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = { Transaction };
