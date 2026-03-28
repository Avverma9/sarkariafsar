const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.SCRAPPER_MONGO_URI || 'mongodb+srv://Avverma:Avverma95766@avverma.2g4orpk.mongodb.net/the-portal?retryWrites=true&w=majority';

mongoose.connect(mongoUri).then(async () => {
  const JobPost = require('../models/post');

  // sectionName unique values
  const sections = await JobPost.aggregate([
    { $group: { _id: '$sectionName', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  console.log('\n--- sectionName values ---');
  sections.forEach(s => console.log(`"${s._id}": ${s.count}`));

  // scrapedMeta.sourceSectionName unique values
  const sourceSections = await JobPost.aggregate([
    { $group: { _id: '$scrapedMeta.sourceSectionName', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);
  console.log('\n--- scrapedMeta.sourceSectionName values ---');
  sourceSections.forEach(s => console.log(`"${s._id}": ${s.count}`));

  mongoose.disconnect();
}).catch(err => { console.error(err); process.exit(1); });
