import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  ...(process.env.GEMINI_API_KEYS || '').split(',').filter(Boolean),
].filter((k, i, a) => k && a.indexOf(k) === i)

const GEMINI_MODELS = ['gemini-2.5-flash-lite', 'gemini-1.5-flash']

// Simple in-memory rate limit: max 30 req/min per IP
const rateLimitMap = new Map()
function isRateLimited(ip) {
  const now = Date.now()
  const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + 60000 }
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + 60000 }
  entry.count++
  rateLimitMap.set(ip, entry)
  return entry.count > 30
}

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ faqs: [] }, { status: 429 })
  }

  try {
    const { content, title } = await req.json()
    if (!content) return NextResponse.json({ faqs: [] })

    const prompt = `Generate 4 FAQ questions and answers for this Indian government content. Return ONLY a JSON array: [{"question": "Q", "answer": "A"}]. No other text.\n\nTitle: ${title || ''}\n\nContent: ${content.slice(0, 1500)}`

    for (const apiKey of GEMINI_KEYS) {
      for (const modelName of GEMINI_MODELS) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey)
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { maxOutputTokens: 500, temperature: 0.3 },
          })
          const result = await Promise.race([
            model.generateContent(prompt),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000)),
          ])
          let text = result.response.text().trim()
          const match = text.match(/\[.*\]/s)
          if (match) text = match[0]
          const faqs = JSON.parse(text)
          if (Array.isArray(faqs) && faqs.length) return NextResponse.json({ faqs })
        } catch { continue }
      }
    }
    return NextResponse.json({ faqs: [] })
  } catch (error) {
    console.error('FAQ error:', error.message)
    return NextResponse.json({ faqs: [] })
  }
}
