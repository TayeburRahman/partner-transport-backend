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
      enum: ['Create', 'Refund', 'Update', 'Withdraw', 'Delete', 'Failed'],
    },
    activity: {
      type: String,
      enum: ['reglue', 'task', 'progressing'],
    },
    status: {
      type: String,
      enum: ['Success', 'Error', 'Warning'],
    },
    date: {
      type: String,  
      default: () => new Date().toISOString().split('T')[0], 
    },
  },
  {
    toJSON: { getters: true }, // Enable getters in JSON output
    toObject: { getters: true }, // Enable getters in object output
  }
);

const LogAdmin = model("LogAdmin", logAdminSchema);

module.exports = { LogAdmin };
