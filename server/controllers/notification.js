const Notification = require('../models/notification');
const JobPost = require('../models/post');
const User = require('../models/user');
const { sendNotificationEmail, sendWelcomeEmail } = require('../utils/mailer');

/**
 * POST /notify/subscribe/:postId
 */
async function subscribe(req, res) {
  try {
    const { postId } = req.params;
    const user = req.user;

    const post = await JobPost.findById(postId).select('title slug sectionCanonicalUrl').lean();
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const existing = await Notification.findOne({ userId: user._id, postId });
    if (existing) {
      if (existing.isActive) {
        return res.json({ success: true, subscribed: true, message: 'Already subscribed' });
      }
      existing.isActive = true;
      existing.subscribedAt = new Date();
      await existing.save();
      // Send welcome email async (non-blocking)
      sendWelcomeEmail(user, post).catch(e => console.error('[Notify] welcome email failed (reactivate):', e));
      return res.json({ success: true, subscribed: true, message: 'Subscription re-activated' });
    }

    await Notification.create({
      userId:              user._id,
      postId,
      slug:                post.slug,
      postTitle:           post.title,
      sectionCanonicalUrl: post.sectionCanonicalUrl,
    });

    // Send welcome email async (non-blocking)
    sendWelcomeEmail(user, post).catch(e => console.error('[Notify] welcome email failed (new):', e));

    return res.status(201).json({ success: true, subscribed: true, message: 'Notification enabled' });
  } catch (err) {
    console.error('[Notify] subscribe', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * DELETE /notify/unsubscribe/:postId
 */
async function unsubscribe(req, res) {
  try {
    const { postId } = req.params;
    await Notification.findOneAndUpdate(
      { userId: req.user._id, postId },
      { $set: { isActive: false } }
    );
    return res.json({ success: true, subscribed: false, message: 'Notification disabled' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * GET /notify/my  — current user's subscriptions
 */
async function mySubscriptions(req, res) {
  try {
    const subs = await Notification.find({ userId: req.user._id, isActive: true })
      .sort({ subscribedAt: -1 })
      .lean();
    return res.json({ success: true, data: subs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * GET /notify/status/:postId  — is current user subscribed?
 */
async function checkStatus(req, res) {
  try {
    const sub = await Notification.findOne({
      userId: req.user._id, postId: req.params.postId
    }).lean();
    return res.json({ success: true, subscribed: !!(sub?.isActive) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * POST /notify/manual/:postId  — admin: send notification to all subscribers of a post
 * Body: { message } (optional custom message)
 */
async function sendManual(req, res) {
  try {
    const { postId } = req.params;
    const { message } = req.body;

    const post = await JobPost.findById(postId).select('title slug sectionCanonicalUrl').lean();
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const subs = await Notification.find({ postId, isActive: true }).lean();
    if (!subs.length) return res.json({ success: true, sent: 0, message: 'No active subscribers' });

    const userIds = subs.map(s => s.userId);
    const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();
    const userMap = Object.fromEntries(users.map(u => [String(u._id), u]));

    const changeDesc = message || 'Admin notification — please check the latest update';

    let sent = 0;
    const now = new Date();
    for (const sub of subs) {
      const user = userMap[String(sub.userId)];
      if (!user) continue;
      try {
        await sendNotificationEmail(user, post, changeDesc);
        sent++;
      } catch (e) {
        console.error('[Notify] email failed for', user.email, e.message);
      }
    }

    // Update lastNotifiedAt for all subs
    await Notification.updateMany({ postId, isActive: true }, { $set: { lastNotifiedAt: now } });

    return res.json({ success: true, sent, total: subs.length });
  } catch (err) {
    console.error('[Notify] sendManual', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * Utility: Called internally from post controller when a post is updated.
 * @param {object} post — updated post doc
 * @param {string} changeDesc — human-readable description
 */
async function notifyPostSubscribers(post, changeDesc) {
  try {
    const subs = await Notification.find({ postId: post._id, isActive: true }).lean();
    if (!subs.length) return;

    const userIds = subs.map(s => s.userId);
    const users   = await User.find({ _id: { $in: userIds } }).select('name email').lean();
    const userMap = Object.fromEntries(users.map(u => [String(u._id), u]));

    const now = new Date();
    for (const sub of subs) {
      const user = userMap[String(sub.userId)];
      if (!user) continue;
      try {
        await sendNotificationEmail(user, post, changeDesc);
      } catch (e) {
        console.error('[Notify] auto-email failed for', user.email, e.message);
      }
    }
    await Notification.updateMany({ postId: post._id, isActive: true }, { $set: { lastNotifiedAt: now } });
  } catch (err) {
    console.error('[Notify] notifyPostSubscribers error', err);
  }
}

module.exports = { subscribe, unsubscribe, mySubscriptions, checkStatus, sendManual, notifyPostSubscribers };
