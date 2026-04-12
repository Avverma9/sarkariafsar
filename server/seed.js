require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const Admin    = require('./models/admin');

const SEED_EMAIL    = 'av95766@gmail.com';
const SEED_PASSWORD = 'Avverma@1';
const SEED_NAME     = 'Ankit Verma';

async function run() {
  await mongoose.connect(process.env.SCRAPPER_MONGO_URI);
  console.log('MongoDB connected');

  const exists = await Admin.findOne({ email: SEED_EMAIL });
  if (exists) {
    console.log('⚠️  Admin already exists — seed skip kiya:', SEED_EMAIL);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);
  await Admin.create({ email: SEED_EMAIL, passwordHash, name: SEED_NAME });
  console.log('✅ Admin seed successful:', SEED_EMAIL);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
