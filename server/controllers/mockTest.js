const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const pdfParse = require('pdf-parse');
const MockTest = require('../models/mockTest');

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseQuestionsFromText(text = '') {
  const questions = [];
  const rejectionReasons = [];

  // Strategy: split on numbered question markers  "1." "1)" "Q1." "Q.1"
  const blocks = text.split(/(?:^|\n)\s*(?:Q\.?\s*)?\d+[.)]\s+/m).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 3) { rejectionReasons.push('Too few lines'); continue; }

    const question = lines[0];

    // Options: accept lines starting with A) A. (A) a) a. (a)
    const optionLines = lines.filter((l) => /^[a-dA-D][.)]\s+|^\([a-dA-D]\)\s+/i.test(l));
    if (optionLines.length !== 4) { rejectionReasons.push(`Expected 4 options, got ${optionLines.length}`); continue; }

    const options = optionLines.map((o) => o.replace(/^[([a-dA-D][.)]\s*/i, '').trim());

    // Answer: look for line containing "Answer:" or "Ans:" or "Correct:"
    const ansLine = lines.find((l) => /^(?:answer|ans|correct)\s*[:\-]/i.test(l));
    let correctIndex = -1;
    if (ansLine) {
      const match = ansLine.match(/[a-dA-D]/);
      if (match) correctIndex = match[0].toUpperCase().charCodeAt(0) - 65;
    }
    if (correctIndex < 0 || correctIndex > 3) { rejectionReasons.push('Could not determine correct answer'); continue; }

    // Explanation (optional)
    const expLine = lines.find((l) => /^(?:explanation|exp|hint)\s*[:\-]/i.test(l));
    const explanation = expLine ? expLine.replace(/^[^::\-]+[:\-]\s*/i, '').trim() : '';

    if (!question || options.some((o) => !o)) { rejectionReasons.push('Empty question or option'); continue; }

    questions.push({ question, options, correctIndex, explanation });
  }

  return { questions, rejectionReasons };
}

// ── POST /mock-tests/upload-pdf ──────────────────────────────────────────────
exports.uploadAndExtract = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'PDF file is required' });

    const { title, jobPostId, conductingAuthorityFull, durationMin, difficulty, examYear, examStage } = req.body || {};
    if (!title) return res.status(400).json({ success: false, message: 'title is required' });

    // Extract text from PDF
    const fileBuffer = fs.readFileSync(req.file.path);
    let extractedText = '';
    try {
      const parsed = await pdfParse(fileBuffer);
      extractedText = parsed.text || '';
    } catch (pdfErr) {
      return res.status(422).json({ success: false, message: 'PDF could not be parsed. Ensure it is text-based (not scanned).', detail: pdfErr.message });
    }

    if (!extractedText.trim()) {
      return res.status(422).json({ success: false, message: 'No text extracted from PDF. File may be scanned/image-based.' });
    }

    // Parse questions
    const { questions, rejectionReasons } = parseQuestionsFromText(extractedText);

    const authorityKey = normalizeAuthorityKey(conductingAuthorityFull || '');

    const mockTest = await MockTest.create({
      title,
      jobPostId: jobPostId && isValidObjectId(jobPostId) ? jobPostId : null,
      conductingAuthorityFull,
      authorityKey,
      sourcePdfPath: req.file.path,
      sourcePdfName: req.file.originalname,
      extractedText,
      durationMin: parseInt(durationMin, 10) || 60,
      difficulty: difficulty || 'mixed',
      examYear: examYear ? parseInt(examYear, 10) : null,
      examStage: examStage || null,
      status: 'draft',
      questions,
      parseStats: {
        totalExtracted: questions.length,
        totalRejected: rejectionReasons.length,
        rejectionReasons: [...new Set(rejectionReasons)],
      },
    });

    return res.status(201).json({
      success: true,
      message: `Mock test created with ${questions.length} questions (${rejectionReasons.length} rejected).`,
      data: {
        _id: mockTest._id,
        title: mockTest.title,
        status: mockTest.status,
        totalQuestions: mockTest.totalQuestions,
        parseStats: mockTest.parseStats,
      },
    });
  } catch (err) {
    return handleError(res, err, 'uploadAndExtract:');
  }
};

// ── GET /mock-tests ──────────────────────────────────────────────────────────
exports.listMockTests = async (req, res) => {
  try {
    const { status, jobPostId, authorityKey, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (jobPostId && isValidObjectId(jobPostId)) filter.jobPostId = jobPostId;
    if (authorityKey) filter.authorityKey = authorityKey;

    const p = Math.max(parseInt(page, 10), 1);
    const l = Math.min(Math.max(parseInt(limit, 10), 1), 100);

    const [tests, total] = await Promise.all([
      MockTest.find(filter, { extractedText: 0, questions: 0 })
        .sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).lean(),
      MockTest.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: tests,
      pagination: { total, page: p, limit: l, totalPages: Math.ceil(total / l) },
    });
  } catch (err) {
    return handleError(res, err, 'listMockTests:');
  }
};

// ── GET /mock-tests/by-post/:postId (only published) ────────────────────────
exports.getMockTestsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!isValidObjectId(postId)) return res.status(400).json({ success: false, message: 'Invalid postId' });

    const tests = await MockTest.find({ jobPostId: postId, status: 'published' }, { extractedText: 0 })
      .sort({ createdAt: -1 }).lean();

    return res.status(200).json({ success: true, data: tests });
  } catch (err) {
    return handleError(res, err, 'getMockTestsByPost:');
  }
};

// ── GET /mock-tests/:id (full, for admin or test-taking) ────────────────────
exports.getMockTest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const test = await MockTest.findById(id, { extractedText: 0 }).lean();
    if (!test) return res.status(404).json({ success: false, message: 'Mock test not found' });

    return res.status(200).json({ success: true, data: test });
  } catch (err) {
    return handleError(res, err, 'getMockTest:');
  }
};

// ── GET /mock-tests/:id/access (auth — questions only if free or purchased) ───
exports.getMockTestAccess = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const test = await MockTest.findById(id, { extractedText: 0 }).lean();
    if (!test) return res.status(404).json({ success: false, message: 'Mock test not found' });
    if (test.status !== 'published') return res.status(403).json({ success: false, message: 'Test not available' });

    const isFree = test.isFree;
    const purchased = (user.purchases || []).some(
      (p) => p.itemType === 'mock_test' && String(p.itemId) === String(id)
    );

    if (!isFree && !purchased) {
      return res.status(403).json({
        success: false,
        message: 'Purchase required to start this test',
        price: test.discountedPrice ?? test.price,
        itemTitle: test.title,
      });
    }

    return res.status(200).json({ success: true, data: test });
  } catch (err) {
    return handleError(res, err, 'getMockTestAccess:');
  }
};

// ── PATCH /mock-tests/:id/questions/:qid ────────────────────────────────────
exports.updateQuestion = async (req, res) => {
  try {
    const { id, qid } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid test id' });

    const test = await MockTest.findById(id);
    if (!test) return res.status(404).json({ success: false, message: 'Mock test not found' });

    const question = test.questions.id(qid);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    const allowed = ['question', 'options', 'correctIndex', 'explanation', 'topic', 'difficulty'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) question[field] = req.body[field];
    });

    await test.save();
    return res.status(200).json({ success: true, message: 'Question updated', data: question });
  } catch (err) {
    return handleError(res, err, 'updateQuestion:');
  }
};

// ── DELETE /mock-tests/:id/questions/:qid ───────────────────────────────────
exports.deleteQuestion = async (req, res) => {
  try {
    const { id, qid } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid test id' });

    const test = await MockTest.findById(id);
    if (!test) return res.status(404).json({ success: false, message: 'Mock test not found' });

    test.questions = test.questions.filter((q) => q._id.toString() !== qid);
    await test.save();

    return res.status(200).json({ success: true, message: 'Question removed', totalQuestions: test.totalQuestions });
  } catch (err) {
    return handleError(res, err, 'deleteQuestion:');
  }
};

// ── POST /mock-tests/:id/publish ─────────────────────────────────────────────
exports.publishMockTest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const test = await MockTest.findById(id);
    if (!test) return res.status(404).json({ success: false, message: 'Mock test not found' });
    if (test.questions.length < 5) {
      return res.status(400).json({ success: false, message: 'Cannot publish: minimum 5 questions required' });
    }

    test.status = 'published';
    test.publishedBy = req.body.publishedBy || 'admin';
    test.publishedAt = new Date();
    await test.save();

    return res.status(200).json({ success: true, message: 'Mock test published', data: { _id: test._id, status: test.status } });
  } catch (err) {
    return handleError(res, err, 'publishMockTest:');
  }
};

// ── PATCH /mock-tests/:id ────────────────────────────────────────────────────
exports.updateMockTest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const disallowed = ['questions', 'extractedText', 'sourcePdfPath'];
    disallowed.forEach((k) => delete req.body[k]);

    const updated = await MockTest.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true, projection: { extractedText: 0 } });
    if (!updated) return res.status(404).json({ success: false, message: 'Mock test not found' });

    return res.status(200).json({ success: true, message: 'Mock test updated', data: updated });
  } catch (err) {
    return handleError(res, err, 'updateMockTest:');
  }
};

// ── DELETE /mock-tests/:id ───────────────────────────────────────────────────
exports.deleteMockTest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const test = await MockTest.findByIdAndDelete(id);
    if (!test) return res.status(404).json({ success: false, message: 'Mock test not found' });

    // Clean up uploaded PDF file if exists
    if (test.sourcePdfPath && fs.existsSync(test.sourcePdfPath)) {
      try { fs.unlinkSync(test.sourcePdfPath); } catch {}
    }

    return res.status(200).json({ success: true, message: 'Mock test deleted' });
  } catch (err) {
    return handleError(res, err, 'deleteMockTest:');
  }
};
