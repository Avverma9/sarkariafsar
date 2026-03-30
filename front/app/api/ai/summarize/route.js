import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function POST(req) {
  try {
    const { content, type, title } = await req.json()
    if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 })

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: { maxOutputTokens: 200, temperature: 0.3 }
    })

    const systemPrompt = type === 'scheme'
      ? `Summarize this government scheme in 3 sentences. Focus on eligibility, benefits, and how to apply.`
      : `Summarize this government job notification in 3 sentences. Include key dates and eligibility.`

    const prompt = `${systemPrompt}\n\nTitle: ${title || ''}\n\nContent: ${content.slice(0, 1500)}`
    const result = await model.generateContent(prompt)
    const summary = result.response.text()
    return NextResponse.json({ summary: summary.trim() })
  } catch (error) {
    console.error('Summarize error:', error.message)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}
