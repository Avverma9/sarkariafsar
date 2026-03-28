const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.SCRAPPER_MONGO_URI || 'mongodb+srv://Avverma:Avverma95766@avverma.2g4orpk.mongodb.net/the-portal?retryWrites=true&w=majority';

mongoose.connect(mongoUri).then(async () => {
  const JobPost = require('../models/post');
  const titles = await JobPost.find({}, { title: 1, _id: 0 }).lean();
  const titleList = titles.map(t => t.title);
  console.log(JSON.stringify(titleList, null, 2));
  mongoose.disconnect();
}).catch(err => { console.error(err); process.exit(1); });
