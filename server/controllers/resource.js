const mongoose = require('mongoose');
const Resource = require('../models/resource');
const JobPost = require('../models/post');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeAuthorityKey = (str = '') =>
  str.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const handleError = (res, err, label = 'Error') => {
  console.error(label, err.message);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: Object.values(err.errors).map((e) => e.message).join(', ') });
  }
  return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
};

// ── POST /resources ─────────────────────────────────────────────────────────
exports.addResource = async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.title || !body.type || !body.accessType || !body.scopeType) {
      return res.status(400).json({ success: false, message: 'title, type, accessType, scopeType are required' });
    }

    if (body.scopeType === 'authority') {
      if (!body.conductingAuthorityFull) {
        return res.status(400).json({ success: false, message: 'conductingAuthorityFull is required for authority scope' });
      }
      body.authorityKey = normalizeAuthorityKey(body.conductingAuthorityFull);
    }

    // Handle uploaded_file via R2 middleware (req.uploadedFile set by uploadMiddleware)
    if (body.accessType === 'uploaded_file' && req.uploadedFile) {
      body.fileUrl = req.uploadedFile.url;
      body.fileName = req.uploadedFile.originalName;
      body.fileSizeBytes = req.uploadedFile.size;
      body.mimeType = req.uploadedFile.mimeType;
    }

    const resource = await Resource.create(body);
    return res.status(201).json({ success: true, message: 'Resource created', data: resource });
  } catch (err) {
    return handleError(res, err, 'addResource:');
  }
};

// ── GET /resources/by-post/:postId ──────────────────────────────────────────
// Fetches authority-level + post-specific resources merged
exports.getResourcesByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!isValidObjectId(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid postId' });
    }

    const post = await JobPost.findById(postId).select('conductingAuthorityFull').lean();
    if (!post) return res.status(404).json({ success: false, message: 'Job post not found' });

    const authorityKey = normalizeAuthorityKey(post.conductingAuthorityFull || '');

    const [authorityResources, postResources] = await Promise.all([
      authorityKey
        ? Resource.find({ scopeType: 'authority', authorityKey, isActive: true })
            .sort({ priority: -1, createdAt: -1 })
            .lean()
        : Promise.resolve([]),
      Resource.find({ scopeType: 'post', jobPostId: postId, isActive: true })
        .sort({ priority: -1, createdAt: -1 })
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        authorityResources,
        postResources,
        conductingAuthorityFull: post.conductingAuthorityFull,
      },
    });
  } catch (err) {
    return handleError(res, err, 'getResourcesByPost:');
  }
};

// ── GET /resources/by-authority ─────────────────────────────────────────────
exports.getResourcesByAuthority = async (req, res) => {
  try {
    const { authorityKey, conductingAuthorityFull } = req.query;
    const key = authorityKey || normalizeAuthorityKey(conductingAuthorityFull || '');
    if (!key) return res.status(400).json({ success: false, message: 'authorityKey or conductingAuthorityFull is required' });

    const resources = await Resource.find({ scopeType: 'authority', authorityKey: key, isActive: true })
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: resources });
  } catch (err) {
    return handleError(res, err, 'getResourcesByAuthority:');
  }
};

// ── GET /resources ───────────────────────────────────────────────────────────
exports.listResources = async (req, res) => {
  try {
    const { type, scopeType, isActive, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (scopeType) filter.scopeType = scopeType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const p = Math.max(parseInt(page, 10), 1);
    const l = Math.min(Math.max(parseInt(limit, 10), 1), 100);

    const [resources, total] = await Promise.all([
      Resource.find(filter).sort({ priority: -1, createdAt: -1 }).skip((p - 1) * l).limit(l).lean(),
      Resource.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: resources,
      pagination: { total, page: p, limit: l, totalPages: Math.ceil(total / l) },
    });
  } catch (err) {
    return handleError(res, err, 'listResources:');
  }
};

// ── PATCH /resources/:id ─────────────────────────────────────────────────────
exports.updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid resource id' });

    const body = req.body || {};
    if (body.conductingAuthorityFull) {
      body.authorityKey = normalizeAuthorityKey(body.conductingAuthorityFull);
    }

    const updated = await Resource.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Resource not found' });

    return res.status(200).json({ success: true, message: 'Resource updated', data: updated });
  } catch (err) {
    return handleError(res, err, 'updateResource:');
  }
};

// ── DELETE /resources/:id ────────────────────────────────────────────────────
exports.deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid resource id' });

    const deleted = await Resource.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Resource not found' });

    return res.status(200).json({ success: true, message: 'Resource deleted' });
  } catch (err) {
    return handleError(res, err, 'deleteResource:');
  }
};
