const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    try {
      const db = mongoose.connection.db;
      const pendingItems = await db.collection('services').find({ status: "pending" }).toArray();
      console.log("Actual pending items in db collection:", pendingItems.length);
      if(pendingItems.length > 0) {
        console.log("Sample pending item:", pendingItems[0]._id, pendingItems[0].status);
      }
    } catch(err) {
      console.error(err);
    }
    process.exit(0);
  });
