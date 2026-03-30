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
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const { content, type, title } = await req.json()
    if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 })

    const systemPrompt = type === 'scheme'
      ? `Summarize this government scheme in 3 sentences. Focus on eligibility, benefits, and how to apply.`
      : `Summarize this government job notification in 3 sentences. Include key dates and eligibility.`
    const prompt = `${systemPrompt}\n\nTitle: ${title || ''}\n\nContent: ${content.slice(0, 1500)}`

    for (const apiKey of GEMINI_KEYS) {
      for (const modelName of GEMINI_MODELS) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey)
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { maxOutputTokens: 200, temperature: 0.3 },
          })
          const result = await Promise.race([
            model.generateContent(prompt),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000)),
          ])
          const summary = result.response.text().trim()
          if (summary) return NextResponse.json({ summary })
        } catch { continue }
      }
    }
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  } catch (error) {
    console.error('Summarize error:', error.message)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}
