const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const logAdminSchema = new Schema(
    {
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
            required: true,
        },
        email: {
            type: String,
            required: true,
        }, 
        description: {
            type: String,
            required: true,
        },
        types: {
            type: String,
            required: true,
            enum: ['Login', 'Create', "Refund",'Update', 'Delete', 'View', "Failed"],
        },
        activity: {
            type: String,
            enum: ['reglue', 'task'],
        },
        status: {
            type: String,
            enum: ['Success', 'Error', 'Warning'],
        },
        date: {
            type: Date,
            default: Date.now,
        }
    } 
);
const LogAdmin = model("LogAdmin", logAdminSchema);

module.exports = { LogAdmin };
