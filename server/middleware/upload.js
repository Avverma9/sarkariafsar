'use strict'

const multer  = require('multer')
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const path    = require('path')
const crypto  = require('crypto')

// ── Allowed MIME types ─────────────────────────────────────────────────────
const MIME_EXT = {
  // Documents
  'application/pdf':  'pdf',
  // Audio
  'audio/mpeg':       'mp3',
  'audio/mp3':        'mp3',
  'audio/wav':        'wav',
  'audio/ogg':        'ogg',
  'audio/aac':        'aac',
  'audio/webm':       'webm',
  'audio/flac':       'flac',
  // Video
  'video/mp4':        'mp4',
  'video/webm':       'webm',
  'video/ogg':        'ogv',
  'video/mpeg':       'mpeg',
  'video/quicktime':  'mov',
  'video/x-msvideo':  'avi',
  // Images
  'image/jpeg':       'jpg',
  'image/png':        'png',
  'image/webp':       'webp',
  'image/gif':        'gif',
  'image/svg+xml':    'svg',
}

// ── R2 / S3 client ─────────────────────────────────────────────────────────
const r2 = new S3Client({
  region:   'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME

// Public base URL: custom domain preferred, else R2 public URL pattern
function publicBase() {
  const custom = process.env.R2_PUBLIC_DOMAIN
  if (custom && custom.trim()) return custom.trim().replace(/\/$/, '')
  return `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev`
}

// ── Core upload helper ─────────────────────────────────────────────────────
/**
 * Upload a buffer directly to R2.
 * @param {Buffer}  buffer
 * @param {string}  originalName
 * @param {string}  mimeType
 * @param {string}  [folder='uploads']  — R2 key prefix
 * @returns {Promise<{url: string, key: string, size: number}>}
 */
async function uploadToR2(buffer, originalName, mimeType, folder = 'uploads') {
  const ext  = MIME_EXT[mimeType] || path.extname(originalName).replace('.', '') || 'bin'
  const uid  = crypto.randomBytes(8).toString('hex')
  const key  = `${folder}/${Date.now()}-${uid}.${ext}`

  await r2.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: mimeType,
    CacheControl: 'public, max-age=31536000, immutable',
  }))

  return { url: `${publicBase()}/${key}`, key, size: buffer.length }
}

// ── Delete helper ──────────────────────────────────────────────────────────
/**
 * Delete a file from R2 by key.
 * @param {string} key  — the R2 object key (not the full URL)
 */
async function deleteFromR2(key) {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

// ── Multer factory ─────────────────────────────────────────────────────────
/**
 * Returns a configured multer instance (memoryStorage).
 * @param {object} [opts]
 * @param {number}   [opts.maxSizeMB=100]
 * @param {string[]} [opts.allowedTypes]   — whitelist of mime types; default: all in MIME_EXT
 */
function buildMulter(opts = {}) {
  const { maxSizeMB = 100, allowedTypes } = opts
  const allowed = allowedTypes || Object.keys(MIME_EXT)

  return multer({
    storage: multer.memoryStorage(),
    limits:  { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter(_req, file, cb) {
      if (allowed.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(Object.assign(
          new Error(`Unsupported file type: ${file.mimetype}. Allowed: ${allowed.join(', ')}`),
          { code: 'UNSUPPORTED_TYPE', status: 415 }
        ))
      }
    },
  })
}

// ── Express middleware factory ─────────────────────────────────────────────
/**
 * Creates an Express middleware array that:
 *   1. Parses the multipart upload (multer)
 *   2. Uploads the file to R2
 *   3. Attaches `req.uploadedFile = { url, key, size, originalName, mimeType }` and proceeds
 *
 * Usage in a route:
 *   router.post('/upload', ...uploadMiddleware('file', 'pdfs'), handler)
 *
 * @param {string} [fieldName='file']   — form-data field name
 * @param {string} [folder='uploads']   — R2 key prefix/folder
 * @param {object} [opts]               — passed to buildMulter
 */
function uploadMiddleware(fieldName = 'file', folder = 'uploads', opts = {}) {
  const upload = buildMulter(opts)

  return [
    // Step 1 — parse multipart with error handling
    (req, res, next) => {
      upload.single(fieldName)(req, res, (err) => {
        if (!err) return next()
        const status = err.code === 'LIMIT_FILE_SIZE' ? 413
          : err.code === 'UNSUPPORTED_TYPE' ? 415
          : 400
        return res.status(status).json({ error: err.message })
      })
    },

    // Step 2 — upload to R2
    async (req, res, next) => {
      if (!req.file) return next()   // optional upload — caller decides if required
      try {
        const { url, key, size } = await uploadToR2(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          folder,
        )
        req.uploadedFile = {
          url,
          key,
          size,
          originalName: req.file.originalname,
          mimeType:     req.file.mimetype,
        }
        next()
      } catch (err) {
        console.error('[R2 upload error]', err)
        res.status(502).json({ error: 'File upload to storage failed', detail: err.message })
      }
    },
  ]
}

/**
 * uploadMultiple — same but for multiple files on one field.
 * Attaches `req.uploadedFiles = [...]`
 *
 * @param {string} fieldName
 * @param {number} [maxCount=10]
 * @param {string} [folder='uploads']
 * @param {object} [opts]
 */
function uploadMultiple(fieldName = 'files', maxCount = 10, folder = 'uploads', opts = {}) {
  const upload = buildMulter(opts)

  return [
    (req, res, next) => {
      upload.array(fieldName, maxCount)(req, res, (err) => {
        if (!err) return next()
        const status = err.code === 'UNSUPPORTED_TYPE' ? 415
          : err.code === 'LIMIT_FILE_SIZE'             ? 413
          : 400
        res.status(status).json({ error: err.message })
      })
    },

    async (req, res, next) => {
      if (!req.files || req.files.length === 0) return next()
      try {
        req.uploadedFiles = await Promise.all(
          req.files.map(f => uploadToR2(f.buffer, f.originalname, f.mimetype, folder)
            .then(({ url, key, size }) => ({
              url, key, size,
              originalName: f.originalname,
              mimeType:     f.mimetype,
            }))
          )
        )
        next()
      } catch (err) {
        console.error('[R2 multi-upload error]', err)
        res.status(502).json({ error: 'File upload to storage failed', detail: err.message })
      }
    },
  ]
}

module.exports = { uploadMiddleware, uploadMultiple, uploadToR2, deleteFromR2, buildMulter, r2 }
