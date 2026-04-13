const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// Verify SMTP connection on startup
transporter.verify((err) => {
  if (err) console.error('[Mailer] SMTP connection FAILED:', err.message);
  else console.log('[Mailer] SMTP connection OK — ready to send emails');
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com';

/**
 * Send a job-change notification email to a subscribed user.
 * @param {object} user  — { name, email }
 * @param {object} post  — { title, slug, sectionCanonicalUrl }
 * @param {string} changeDesc — human-readable description of what changed
 */
async function sendNotificationEmail(user, post, changeDesc) {
  const postUrl = `${SITE_URL}/jobs/${post.slug}`;
  const unsubUrl = `${SITE_URL}/dashboard`;

  const html = `
<!DOCTYPE html>
<html lang="hi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;">
        <!-- Header -->
        <tr>
          <td style="background:#1B3A6E;padding:24px 30px;">
            <h1 style="color:#fff;margin:0;font-size:20px;">🔔 SarkariAfsar</h1>
            <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px;">Job Alert Notification</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:30px;">
            <p style="color:#333;font-size:15px;margin:0 0 10px;">नमस्ते <strong>${user.name}</strong>,</p>
            <p style="color:#555;font-size:14px;margin:0 0 20px;">
              आपने जिस job post के लिए notification enable की है, उसमें कुछ बदलाव हुआ है:
            </p>

            <!-- Post card -->
            <div style="background:#f8f9ff;border-left:4px solid #1B3A6E;border-radius:4px;padding:16px 20px;margin-bottom:20px;">
              <div style="font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">Job Post</div>
              <div style="font-size:16px;font-weight:700;color:#1B3A6E;margin-bottom:8px;">${post.title}</div>
              <div style="font-size:14px;color:#e07b00;font-weight:600;">📋 ${changeDesc}</div>
            </div>

            <a href="${postUrl}" style="display:inline-block;background:#1B3A6E;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:600;">
              पूरी Details देखें →
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f4f4f4;padding:16px 30px;border-top:1px solid #eee;">
            <p style="color:#aaa;font-size:12px;margin:0;">
              यह email इसलिए आया क्योंकि आपने इस post के लिए notification enable की थी।
              <a href="${unsubUrl}" style="color:#888;">Unsubscribe करें</a> |
              <a href="${SITE_URL}" style="color:#888;">SarkariAfsar.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const info = await transporter.sendMail({
    from: `"SarkariAfsar Alert" <${process.env.MAIL_USER}>`,
    to:   user.email,
    subject: `🔔 ${post.title} — ${changeDesc}`,
    html,
  });
  console.log('[Mailer] Notification email sent to', user.email, '| messageId:', info.messageId);
}

/**
 * Send a welcome/confirmation email when user subscribes to a job post.
 * @param {object} user  — { name, email }
 * @param {object} post  — { title, slug }
 */
async function sendWelcomeEmail(user, post) {
  const postUrl   = `${SITE_URL}/jobs/${post.slug}`;
  const unsubUrl  = `${SITE_URL}/dashboard?tab=notifications`;
  const dashUrl   = `${SITE_URL}/dashboard`;

  const html = `
<!DOCTYPE html>
<html lang="hi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1B3A6E 0%,#0D5C3A 100%);padding:28px 30px;">
            <h1 style="color:#fff;margin:0;font-size:22px;">✅ Notification Activated!</h1>
            <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:13px;">SarkariAfsar Job Alert</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 30px;">
            <p style="color:#333;font-size:15px;margin:0 0 8px;">नमस्ते <strong>${user.name}</strong>,</p>
            <p style="color:#555;font-size:14px;margin:0 0 24px;line-height:1.7;">
              आपने नीचे दी गई job post के लिए <strong>notification successfully enable</strong> कर दी है।
              जब भी इस post में कोई update आएगा — जैसे last date extend होना, new vacancy, admit card, result —
              हम आपको <strong>email alert</strong> भेजेंगे।
            </p>

            <!-- Post card -->
            <div style="background:#f0f7f0;border:1px solid #b7e0c5;border-left:4px solid #0D5C3A;border-radius:6px;padding:18px 22px;margin-bottom:28px;">
              <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:8px;">📌 Subscribed Job Post</div>
              <div style="font-size:17px;font-weight:700;color:#1B3A6E;margin-bottom:12px;">${post.title}</div>
              <a href="${postUrl}" style="display:inline-block;background:#1B3A6E;color:#fff;text-decoration:none;padding:10px 22px;border-radius:5px;font-size:13px;font-weight:600;">
                Job Details देखें →
              </a>
            </div>

            <!-- What to expect -->
            <div style="background:#fff8e6;border:1px solid #f5d679;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
              <div style="font-size:13px;font-weight:700;color:#7a4f00;margin-bottom:8px;">📬 आपको notification कब मिलेगी?</div>
              <ul style="margin:0;padding-left:18px;color:#555;font-size:13px;line-height:1.9;">
                <li>Apply Last Date में बदलाव</li>
                <li>Vacancy में बढ़ोतरी या कमी</li>
                <li>Admit Card / Result जारी होने पर</li>
                <li>Post Active/Inactive होने पर</li>
                <li>कोई भी महत्वपूर्ण update</li>
              </ul>
            </div>

            <a href="${dashUrl}" style="display:inline-block;background:#f59e0b;color:#fff;text-decoration:none;padding:11px 26px;border-radius:6px;font-size:13px;font-weight:700;">
              My Dashboard देखें
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f4f4f4;padding:16px 30px;border-top:1px solid #eee;">
            <p style="color:#aaa;font-size:12px;margin:0;line-height:1.7;">
              यह confirmation email है। Notification बंद करने के लिए
              <a href="${unsubUrl}" style="color:#888;">यहाँ क्लिक करें</a> |
              <a href="${SITE_URL}" style="color:#888;">SarkariAfsar.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const info = await transporter.sendMail({
    from:    `"SarkariAfsar Alert" <${process.env.MAIL_USER}>`,
    to:      user.email,
    subject: `✅ Notification Active: ${post.title}`,
    html,
  });
  console.log('[Mailer] Welcome email sent to', user.email, '| messageId:', info.messageId);
}

/**
 * Send OTP email using SMTP credentials stored in AuthSettings (DB).
 * @param {string} toEmail
 * @param {string} otp
 * @param {number} expireMinutes
 */
async function sendOtpEmail(toEmail, otp, expireMinutes) {
  const AuthSettings = require('../models/authSettings');
  const cfg = await AuthSettings.getSingleton();

  const dynamicTransporter = nodemailer.createTransport({
    host:   cfg.smtpHost   || 'smtp.gmail.com',
    port:   cfg.smtpPort   || 465,
    secure: cfg.smtpSecure !== false,
    auth: {
      user: cfg.smtpUser,
      pass: cfg.smtpPass,
    },
  });

  await dynamicTransporter.sendMail({
    from:    cfg.smtpFrom || cfg.smtpUser,
    to:      toEmail,
    subject: 'Your Sarkari Afsar Login OTP',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#1d4ed8;margin-bottom:8px;">Login OTP — Sarkari Afsar</h2>
        <p style="color:#374151;font-size:15px;">Your one-time password is:</p>
        <div style="font-size:40px;font-weight:700;letter-spacing:10px;color:#111827;margin:24px 0;text-align:center;background:#fff;padding:18px;border-radius:8px;border:2px dashed #e5e7eb;">
          ${otp}
        </div>
        <p style="color:#6b7280;font-size:13px;">Valid for <strong>${expireMinutes} minutes</strong>. Do not share this OTP with anyone.</p>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Sarkari Afsar — Government Jobs Portal</p>
      </div>
    `,
  });
}

module.exports = { sendNotificationEmail, sendWelcomeEmail, sendOtpEmail };
