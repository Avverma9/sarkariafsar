const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.SCRAPPER_MONGO_URI || 'mongodb+srv://Avverma:Avverma95766@avverma.2g4orpk.mongodb.net/the-portal?retryWrites=true&w=majority';

mongoose.connect(mongoUri).then(async () => {
  const JobPost = require('../models/post');

  const result = await JobPost.aggregate([
    {
      $group: {
        _id: {
          $cond: [
            { $gt: [{ $strLenCP: { $ifNull: ['$conductingAuthority', ''] } }, 0] },
            '$conductingAuthority',
            'Unknown'
          ]
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  console.log('\n--- Organizations & Post Count ---\n');
  result.forEach(r => console.log(`${r._id}: ${r.count}`));
  console.log(`\nTotal organizations: ${result.length}`);
  console.log(`Total posts: ${result.reduce((a, r) => a + r.count, 0)}`);

  mongoose.disconnect();
}).catch(err => { console.error(err); process.exit(1); });
