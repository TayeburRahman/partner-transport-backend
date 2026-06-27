const mongoose = require('mongoose');
require('dotenv').config();
const Services = require('./src/app/modules/services/services.model');

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    try {
      const allServices = await Services.find({ status: { $ne: "pending" } });
      const missingStatus = allServices.filter(s => !s.status);
      console.log("Missing/null status count:", missingStatus.length);
      const pendingLike = allServices.filter(s => s.status === 'pending' || s.status === 'Pending' || s.status === ' PENDING ');
      console.log("pending-like status count:", pendingLike.length);
      
      if(missingStatus.length > 0) {
        console.log("Sample missing:", missingStatus[0]);
      }
    } catch(err) {
      console.error(err);
    }
    process.exit(0);
  });
