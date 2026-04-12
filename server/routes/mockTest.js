const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const ctrl = require('../controllers/mockTest');

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, '../uploads/mock-pdfs');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-z0-9.\-_]/gi, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const uploadPdf = multer({
  storage: pdfStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('Only PDF files are allowed for mock test generation'));
  },
});

// ── Routes ──────────────────────────────────────────────────────────────────

// Upload PDF + extract questions → creates draft mock test
router.post('/upload-pdf', uploadPdf.single('pdf'), ctrl.uploadAndExtract);

// List all mock tests (admin — filterable by status/jobPostId/authorityKey)
router.get('/', ctrl.listMockTests);

// Get published mock tests for a specific job post (user-facing)
router.get('/by-post/:postId', ctrl.getMockTestsByPost);

// Get single mock test by id (full detail — admin + test-taking)
router.get('/:id', ctrl.getMockTest);

// Update mock test metadata (title, durationMin, etc — not questions)
router.patch('/:id', ctrl.updateMockTest);

// Publish mock test (admin review → publish)
router.post('/:id/publish', ctrl.publishMockTest);

// Update a specific question
router.patch('/:id/questions/:qid', ctrl.updateQuestion);

// Delete a specific question
router.delete('/:id/questions/:qid', ctrl.deleteQuestion);

// Delete entire mock test
router.delete('/:id', ctrl.deleteMockTest);

module.exports = router;
