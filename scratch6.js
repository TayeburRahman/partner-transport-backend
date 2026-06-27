const mongoose = require('mongoose');
require('dotenv').config();
const { DashboardService } = require('./src/app/modules/dashboard/dashboard.service');

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    try {
      const result = await DashboardService.getAllAuctions({});
      result.data.forEach(item => {
        console.log(`ID: ${item._id}, status: ${item.status}, paymentStatus: ${item.paymentStatus}`);
      });
    } catch(err) {
      console.error(err);
    }
    process.exit(0);
  });
