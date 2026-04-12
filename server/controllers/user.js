const User = require('../models/user');
const JobPost = require('../models/post');
const MockTest = require('../models/mockTest');

/**
 * POST /user/save/:postId  — toggle save/unsave a job post
 */
async function toggleSaveJob(req, res) {
  try {
    const { postId } = req.params;
    const user = req.user;

    const alreadySaved = user.savedJobs.some(j => String(j.postId) === postId);

    if (alreadySaved) {
      await User.findByIdAndUpdate(user._id, {
        $pull: { savedJobs: { postId } },
      });
      return res.json({ success: true, saved: false, message: 'Job removed from saved list' });
    }

    const post = await JobPost.findById(postId).select('title slug').lean();
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    await User.findByIdAndUpdate(user._id, {
      $push: { savedJobs: { postId, slug: post.slug, title: post.title, savedAt: new Date() } },
    });
    return res.json({ success: true, saved: true, message: 'Job saved successfully' });
  } catch (err) {
    console.error('[User] toggleSaveJob', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * GET /user/saved  — list all saved jobs for current user
 */
async function getSavedJobs(req, res) {
  try {
    const user = await User.findById(req.user._id).select('savedJobs').lean();
    return res.json({ success: true, data: user.savedJobs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * POST /user/mock-history  — record a completed mock test
 * Body: { testId, score, totalQ, timeTakenSec }
 */
async function addMockHistory(req, res) {
  try {
    const { testId, score, totalQ, timeTakenSec } = req.body;
    if (!testId) return res.status(400).json({ success: false, message: 'testId required' });

    const test = await MockTest.findById(testId).select('title').lean();
    const entry = {
      testId,
      testTitle: test?.title || '',
      score: score || 0,
      totalQ: totalQ || 0,
      timeTakenSec: timeTakenSec || 0,
      takenAt: new Date(),
    };

    await User.findByIdAndUpdate(req.user._id, {
      $push: { mockTestHistory: { $each: [entry], $position: 0 } },
    });
    return res.json({ success: true, message: 'Mock test recorded', data: entry });
  } catch (err) {
    console.error('[User] addMockHistory', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * GET /user/mock-history  — list user's mock test attempts
 */
async function getMockHistory(req, res) {
  try {
    const user = await User.findById(req.user._id).select('mockTestHistory').lean();
    return res.json({ success: true, data: user.mockTestHistory });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * GET /user/profile  — full profile
 */
async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .select('-__v')
      .lean();
    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * GET /user/all  — admin: list all users
 */
async function getAllUsers(req, res) {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().select('-__v').skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      User.countDocuments(),
    ]);
    return res.json({
      success: true,
      data: users,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { toggleSaveJob, getSavedJobs, addMockHistory, getMockHistory, getProfile, getAllUsers };
