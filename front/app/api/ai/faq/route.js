import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function POST(req) {
  try {
    const { content, title } = await req.json()
    if (!content) return NextResponse.json({ faqs: [] })

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: { maxOutputTokens: 500, temperature: 0.3 }
    })

    const prompt = `Generate 4 FAQ questions and answers for this Indian government content. Return ONLY a JSON array: [{"question": "Q", "answer": "A"}]. No other text.\n\nTitle: ${title || ''}\n\nContent: ${content.slice(0, 1500)}`
    const result = await model.generateContent(prompt)
    let text = result.response.text().trim()
    // Extract JSON array from response
    const match = text.match(/\[.*\]/s)
    if (match) text = match[0]
    const faqs = JSON.parse(text)
    return NextResponse.json({ faqs: Array.isArray(faqs) ? faqs : [] })
  } catch (error) {
    console.error('FAQ error:', error.message)
    return NextResponse.json({ faqs: [] })
  }
}
