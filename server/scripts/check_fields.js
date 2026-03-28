const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.SCRAPPER_MONGO_URI || 'mongodb+srv://Avverma:Avverma95766@avverma.2g4orpk.mongodb.net/the-portal?retryWrites=true&w=majority';

mongoose.connect(mongoUri).then(async () => {
  const JobPost = require('../models/post');

  // Sample 3 posts to see actual field values
  const samples = await JobPost.find({}).limit(3).lean();
  samples.forEach((p, i) => {
    console.log(`\n--- Post ${i+1} ---`);
    console.log('title:', p.title);
    console.log('jobtitle:', p.jobtitle);
    console.log('category:', p.category);
    console.log('sectionName:', p.sectionName);
    console.log('conductingAuthority:', p.conductingAuthority);
    console.log('conducting_authority:', p.conducting_authority);
    console.log('tags:', p.tags);
    console.log('status:', p.status);
  });

  // Check which fields have non-empty values across all posts
  console.log('\n--- Field fill rate ---');
  const fields = ['category', 'sectionName', 'conductingAuthority', 'conducting_authority', 'jobtitle', 'status'];
  for (const field of fields) {
    const count = await JobPost.countDocuments({ [field]: { $ne: '', $exists: true, $ne: null } });
    console.log(`${field}: ${count} non-empty`);
  }

  mongoose.disconnect();
}).catch(err => { console.error(err); process.exit(1); });
