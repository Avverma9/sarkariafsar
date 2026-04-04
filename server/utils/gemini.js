/**
 * server/utils/gemini.js
 * Shared Gemini AI helper for server-side cron jobs.
 * Uses @google/generative-ai (already in server/package.json).
 * Rotates through ALL keys × ALL models on 429/failure.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEYS = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
  .split(',').map(k => k.trim()).filter(Boolean);

const MODELS = (process.env.GEMINI_MODELS || '')
  .split(',').map(m => m.trim()).filter(Boolean);

if (!MODELS.length) {
  MODELS.push(
    'gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash',
    'gemini-2.0-flash-001', 'gemini-2.0-flash-lite', 'gemini-2.0-flash-lite-001',
    'gemini-2.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3-flash-preview', 'gemini-pro-latest'
  );
}

/**
 * Generate text from Gemini with full key + model rotation.
 * @param {string} prompt
 * @returns {Promise<string>} generated text
 * @throws if all combinations fail
 */
async function generateText(prompt) {
  if (!API_KEYS.length) throw new Error('No GEMINI_API_KEYS set in server .env');

  const errors = [];
  for (const model of MODELS) {
    for (let ki = 0; ki < API_KEYS.length; ki++) {
      try {
        const genAI = new GoogleGenerativeAI(API_KEYS[ki]);
        const genModel = genAI.getGenerativeModel({ model });
        const result = await genModel.generateContent(prompt);
        const text = result.response?.text()?.trim();
        if (!text) {
          errors.push({ model, ki, err: 'empty response' });
          continue;
        }
        return text;
      } catch (err) {
        const msg = err.message || String(err);
        errors.push({ model, ki, err: msg.slice(0, 100) });
        continue;
      }
    }
  }
  throw new Error(`All Gemini keys+models failed. Last errors: ${JSON.stringify(errors.slice(-5))}`);
}

module.exports = { generateText };
