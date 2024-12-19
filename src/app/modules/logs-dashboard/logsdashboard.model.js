const mongoose = require("mongoose");
const { Schema, model } = mongoose;

// Helper function to format time
const formatTime = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZoneName: "short",
  });

  return formatter.format(now); 
};

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
    attended: {
        type: String,
        enum: ['reglue', 'tickets', 'complaints', "withdraw"],
        default: 'reglue',
      },
    status: {
      type: String,
      enum: ['Success', 'Error', 'Warning'],
    },
    date: {
      type: String,  
      default: () => new Date().toISOString().split('T')[0],  
    },
    time: {
      type: String,
      default: formatTime,  
    },
  },
  {
    toJSON: { getters: true },  
    toObject: { getters: true },  
  }
);

const LogAdmin = model("LogAdmin", logAdminSchema);

module.exports = { LogAdmin };
