const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const ctrl = require('../controllers/resource');

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, '../uploads/resources');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-z0-9.\-_]/gi, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only PDF and image files are allowed'));
  },
});

// ── Routes ──────────────────────────────────────────────────────────────────

// Create resource (with optional file upload)
router.post('/', upload.single('file'), ctrl.addResource);

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
