import { GoogleGenAI } from '@google/genai'

export async function POST(req) {
  try {
    const body = await req.json()
    const post = body.post || body

    const title     = post.title || ''
    const authority = post.conductingAuthority || ''
    const vacancies = post.totalVacancies ? `Total Vacancies: ${post.totalVacancies}.` : ''
    const salary    = post.salary ? `Pay Scale: ${post.salary}.` : ''
    const lastDate  = post.applyLastDate
      ? `Last Date to Apply: ${new Date(post.applyLastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}.`
      : ''
    const category = post.category || ''
    const location = post.location || ''
    const section  = post.sectionName || ''

    const prompt = `You are a helpful government job portal writer. Write a clear, informative, human-style summary (around 200 words) for the following government job post. Include key details like authority, vacancies, eligibility, salary, last date, and how to apply. Write in simple English. Do NOT use bullet points — write in flowing paragraphs only.

Job Title: ${title}
Conducting Authority: ${authority}
Category: ${category}
Section: ${section}
Location: ${location}
${vacancies}
${salary}
${lastDate}

Return ONLY the summary paragraphs, no headings.`

    const apiKeys = (process.env.GEMINI_API_KEYS || '')
      .split(',')
      .map(k => k.trim())
      .filter(Boolean)

    if (!apiKeys.length) {
      return new Response(
        JSON.stringify({ error: 'No GEMINI_API_KEYS configured on server.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Try models in order from GEMINI_MODELS env — if quota (429) hit, skip to next model+key combo
    const envModels = (process.env.GEMINI_MODELS || '')
      .split(',')
      .map(m => m.trim())
      .filter(Boolean)
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    // Ensure primary is first, rest follow, no duplicates
    const models = [...new Set([primaryModel, ...envModels])]

    const errors = []

    for (const model of models) {
      for (let i = 0; i < apiKeys.length; i++) {
        try {
          const ai = new GoogleGenAI({ apiKey: apiKeys[i] })
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
          })
          const summary = response.text?.trim()
          if (!summary) {
            errors.push({ model, keyIndex: i, status: 'no-summary' })
            continue
          }
          return new Response(
            JSON.stringify({ summary }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        } catch (err) {
          const msg = String(err)
          errors.push({ model, keyIndex: i, error: msg.slice(0, 120) })
          // If 429 quota on this key, try next key; if all keys 429 on this model, try next model
          continue
        }
      }
    }

    return new Response(
      JSON.stringify({ error: 'All models and keys failed', errors }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
