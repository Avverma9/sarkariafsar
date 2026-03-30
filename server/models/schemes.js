const mongoose = require("mongoose");

// ───) "mongoose";

const govSchemeSchema = new mongoose.Schema({
  schemeTitle: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  schemetype: {
    type: String,
    default: "",
    trim: true,
    index: true,
  },
  requiredDocs: {
    type: [String],
    default: [],
  },
  process: {
    type: String,
    default: "",
    trim: true,
  },
  state: {
    type: String,
    default: "",
    trim: true,
    index: true,
  },
  city: {
    type: String,
    default: "",
    trim: true,
    index: true,
  },
  schemeStartDate: {
    type: Date,
    default: null,
    index: true,
  },
  schemeLastDate: {
    type: Date,
    default: null,
    index: true,
  },
  applyLink: {
    type: String,
    default: "",
    trim: true,
  },
  aboutScheme: {
    type: String,
    default: "",
    trim: true,
  },

  // ── Official Source (YMYL - mandatory for govt schemes) ──
  officialSourceUrl: {
    type: String,
    default: "",
    trim: true,
  },

  slug: {
    type: String,
    default: "",
    trim: true,
    index: true,
  },

  // ── Author / YMYL fields ──
  authorName: {
    type: String,
    default: "",
    trim: true,
  },

  authorProfileUrl: {
    type: String,
    default: "",
    trim: true,
  },

  authorBio: {
    type: String,
    default: "",
    trim: true,
  },

  wordCount: {
    type: Number,
    default: 0,
  },

  noIndex: {
    type: Boolean,
    default: false,
    index: true,
  },
}, {
  strict: false,
  minimize: false,
  timestamps: true,
});

const GovScheme = mongoose.models.GovScheme || mongoose.model("GovScheme", govSchemeSchema, "gov_schemes");

module.exports = GovScheme;

