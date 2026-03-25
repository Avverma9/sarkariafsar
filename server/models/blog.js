const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  heading: { type: String, required: true },
  paragraphs: [String],  // Array of strings
  bullets: [String]      // Optional array of strings
}, { _id: false });  // No _id for subdocs

const blogSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  excerpt: { type: String, required: true },
  publishedAt: { type: Date, default: Date.now },
  readingTime: { type: String, default: '5 min read' },
  author: { type: String, required: true },
  category: { type: String, required: true },
  tags: [{ type: String }],
  intro: { type: String, required: true },
  sections: [sectionSchema]  // Embedded sections array
}, {
  strict: false,  // Allows extra fields if needed
  timestamps: true
});

// Indexes for queries (e.g., by category/tags/publishedAt)
blogSchema.index({ category: 1, publishedAt: -1 });
blogSchema.index({ tags: 1 });

module.exports = mongoose.model('Blog', blogSchema);
