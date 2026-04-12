const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/resource');
const { uploadMiddleware } = require('../middleware/upload');

// ── Routes ──────────────────────────────────────────────────────────────────

// Create resource (with optional file upload to R2)
// Supports: PDF, images, audio, video (max 100MB for video, 20MB for others)
router.post('/', ...uploadMiddleware('file', 'resources', { 
  maxSizeMB: 100, // 100MB for video support
  allowedTypes: [
    // Documents
    'application/pdf',
    // Images
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    // Audio
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    // Video
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/mpeg',
    'video/quicktime',
  ]
}), ctrl.addResource);

// List all resources (admin)
router.get('/', ctrl.listResources);

// Fetch resources for a specific job post (authority + post-specific merged)
router.get('/by-post/:postId', ctrl.getResourcesByPost);

// Fetch authority-level resources by authorityKey or conductingAuthorityFull
router.get('/by-authority', ctrl.getResourcesByAuthority);

// Update resource
router.patch('/:id', ctrl.updateResource);

// Delete resource
router.delete('/:id', ctrl.deleteResource);

module.exports = router;
