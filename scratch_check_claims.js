const mongoose = require('mongoose');
const config = require('./src/config');
const { FileClaim } = require('./src/app/modules/bid/bid.model');

async function check() {
  await mongoose.connect(config.database_url);
  console.log("Connected to DB");
  const claims = await FileClaim.find({}).limit(5).lean();
  console.log("Claims details:", JSON.stringify(claims, null, 2));
  await mongoose.disconnect();
}

check().catch(console.error);
