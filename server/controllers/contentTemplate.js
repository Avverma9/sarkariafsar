const ContentTemplate = require("../models/contentTemplate");
const { generateHumanContent } = require("../utils/contentInjector");
const JobPost = require("../models/post");

// List all templates
exports.listTemplates = async (req, res) => {
  try {
    const { pageType, active } = req.query;
    const filter = {};
    if (pageType) filter.pageType = pageType;
    if (active !== undefined) filter.active = active === "true";
    const templates = await ContentTemplate.find(filter).sort({ pageType: 1 });
    res.json({ success: true, data: templates });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Get one template by templateId
exports.getTemplate = async (req, res) => {
  try {
    const doc = await ContentTemplate.findOne({ templateId: req.params.templateId });
    if (!doc) return res.status(404).json({ success: false, message: "Template not found" });
    res.json({ success: true, data: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Create template
exports.createTemplate = async (req, res) => {
  try {
    const doc = await ContentTemplate.create(req.body);
    res.status(201).json({ success: true, data: doc });
  } catch (e) {
    if (e.code === 11000)
      return res.status(409).json({ success: false, message: "templateId already exists" });
    res.status(400).json({ success: false, message: e.message });
  }
};

// Update template
exports.updateTemplate = async (req, res) => {
  try {
    const doc = await ContentTemplate.findOneAndUpdate(
      { templateId: req.params.templateId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: "Template not found" });
    res.json({ success: true, data: doc });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

// Delete template
exports.deleteTemplate = async (req, res) => {
  try {
    const doc = await ContentTemplate.findOneAndDelete({ templateId: req.params.templateId });
    if (!doc) return res.status(404).json({ success: false, message: "Template not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Preview: inject a template into a specific post (by slug)
exports.previewContent = async (req, res) => {
  try {
    const { slug, templateId, blockCount } = req.query;
    if (!slug) return res.status(400).json({ success: false, message: "slug is required" });

    const post = await JobPost.findOne({ slug }).lean();
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    let template;
    if (templateId) {
      template = await ContentTemplate.findOne({ templateId });
    } else {
      template = await ContentTemplate.findOne({
        pageType: post.pageType,
        language: post.language || "hi",
        active: true,
      });
    }
    if (!template) return res.status(404).json({ success: false, message: "No matching template" });

    const humanContent = generateHumanContent(post, template.blocks, {
      blockCount: parseInt(blockCount, 10) || 4,
      deterministicSeed: post._id.toString(),
    });

    res.json({
      success: true,
      data: {
        postTitle: post.title,
        pageType: post.pageType,
        templateUsed: template.templateId,
        humanContent,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
