const mongoose = require('mongoose');

const jobPostSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  dedupeKey: { type: String, unique: true },
  titleSignature: { type: String },
  version: { type: Number, default: 1 },

  title: { type: String, required: true },
  shortTitle: { type: String },
  jobtitle: { type: String },
  summary: { type: String },

  sectionName: { type: String },
  sectionCanonicalUrl: { type: String },
  category: { type: String },
  subCategory: { type: String },
  schemaType: { type: String, default: 'Article' },
  pageType: { type: String },
  language: { type: String, default: 'hi' },
  status: { type: String, default: 'active' },
  isActive: { type: Boolean, default: true },
  noIndex: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },

  conductingAuthority: { type: String },
  conductingAuthorityFull: { type: String },
  advertisementNumber: { type: String },
  location: { type: String },
  state: { type: String },
  officialWebsite: { type: String },

  dates: {
    applyStart: { type: Date },
    regLastDate: { type: Date },
    feeLastDate: { type: Date },
    correctionDate: { type: Date },
    applyEnd: { type: Date },
    examDate: { type: Date },
    examDatePGT: { type: Date },
    examDatePGTEnd: { type: Date },
    examDateTGT: { type: Date },
    examDateTGTEnd: { type: Date },
    admitCard: { type: Date, default: null },
    result: { type: Date, default: null },
    lastUpdated: { type: Date }
  },

  applyLastDate: { type: Date },
  examDate: { type: Date },

  totalVacancies: { type: Number },
  vacancySummary: {
    tgt: { men: Number, women: Number, total: Number },
    pgt: { men: Number, women: Number, total: Number },
    grand: Number
  },

  ageLimit: {
    min: { type: Number },
    max: { type: Number, default: null },
    asOn: { type: Date },
    relaxation: { type: Boolean },
    note: { type: String }
  },

  applicationFee: {
    general: Number,
    obc: Number,
    ews: Number,
    sc: Number,
    st: Number,
    ph: Number,
    currency: { type: String, default: 'INR' },
    paymentModes: [String]
  },

  selectionProcess: [String],

  eligibility: [{
    post: String,
    qualification: String,
    payScale: String
  }],

  salary: { type: String, default: null },

  thumbnail: { type: String, default: null },

  seo: {
    metaTitle: String,
    metaDescription: String,
    canonicalUrl: String,
    ogTitle: String,
    ogDescription: String,
    ogImage: String,
    keywords: [String],
    focusKeyword: String
  },

  author: {
    name: String,
    bio: String,
    profileUrl: String
  },

  tags: [String],

  structured: {
    vacancyTable: [{
      post: String,
      gender: String,
      count: Number,
      ur: Number,
      obc: Number,
      sc: Number,
      st: Number,
      ews: Number,
      total: Number,
      qualification: String,
      payScale: String
    }],
    faq: [{
      q: String,
      a: String
    }],
    importantLinks: [{
      label: String,
      url: String,
      type: { type: String }
    }],
    howToCheck: [String]
  },

  scrapedContent: {
    contentHtml: String,
    contentJson: { type: mongoose.Schema.Types.Mixed },
    extractedAt: { type: Date }
  },
  sourceUrl: String,
  scrapedMeta: {
    sourceSiteName: String,
    sourceSectionName: String,
    sourceSectionUrl: String
  },

  humanContent: {
    templateId: { type: String },
    templateVersion: { type: Number },
    seed: { type: String },
    blocks: [{
      blockId: { type: String },
      type: { type: String },
      content: { type: String }
    }],
    wordCount: { type: Number, default: 0 },
    generatedAt: { type: Date }
  },

  wordCount: { type: Number, default: 0 },
  readingTimeMin: { type: Number, default: 0 },
  completenessScore: { type: Number, default: 0 },

  disclaimer: { type: String },
  htmlSnapshot: { type: String },
  lastPatchedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true 
});

const JobPost = mongoose.model('JobPost', jobPostSchema);

module.exports = JobPost;