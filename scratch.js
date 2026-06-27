const mongoose = require('mongoose');
require('dotenv').config();
const { DashboardService } = require('./src/app/modules/dashboard/dashboard.service');

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    try {
      const result = await DashboardService.getAllAuctions({});
      const pendingItems = result.data.filter(item => item.status === 'pending');
      console.log("Total items:", result.data.length);
      console.log("Pending items count:", pendingItems.length);
      if(pendingItems.length > 0) {
        console.log("First pending item status:", pendingItems[0].status);
      }
    } catch(err) {
      console.error(err);
    }
    process.exit(0);
  });
