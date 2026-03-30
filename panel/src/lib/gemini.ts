import { GoogleGenAI } from "@google/genai";

// Multiple API keys — comma-separated from GEMINI_API_KEYS env variable
const API_KEYS = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

if (API_KEYS.length === 0) {
  throw new Error("No Gemini API keys configured. Set GEMINI_API_KEYS in .env");
}

// 3 models — one is picked randomly on each call; on failure, next key tries a new random model
const MODELS = [
  "gemini-2.5-pro-preview",
  "gemini-2.0-flash-exp",
  "gemini-1.5-pro-latest",
];

function getRandomModel(): string {
  return MODELS[Math.floor(Math.random() * MODELS.length)];
}

export async function enhanceJsonWithGemini(jsonString: string): Promise<string> {
  const prompt = `
You are an expert SEO content writer, data enhancer, and fact-checker.
I will provide you with a JSON object (or an array of JSON objects) representing content (Job Post, Blog, Government Scheme, or Section).

Your task is to:
1. Focus primarily on enhancing the "contentHtml" field (inside "scrapedContent") and other main text content fields.
2. Rephrase and significantly expand these content fields to make them highly valuable, meaningful, and comprehensive. Aim for 1000+ human written words of total content if possible. Add relevant details, headings, and bullet points to make it high-value for readers.
3. For HTML fields like "contentHtml", ensure you return valid, well-structured HTML.
4. IMPORTANT FACT-CHECKING: Use Google Search to check important dates (like application deadlines, exam dates) and official links. If the dates have been officially extended or the official links have been updated in reality, update them in the JSON. Otherwise, keep them as they are.
5. DO NOT change the structure of the JSON. Keep all keys exactly the same.
6. DO NOT change IDs, slugs, or boolean values.
7. Return ONLY the raw JSON, preserving whether it was an object or an array, without any markdown formatting or code blocks.

Here is the JSON to enhance:
${jsonString}
`;

  let lastError: unknown;

  for (let i = 0; i < API_KEYS.length; i++) {
    const apiKey = API_KEYS[i];
    const model = getRandomModel();
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }],
        },
      });

      if (!response.text) {
        throw new Error("No response from Gemini");
      }

      return response.text;
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini] Key index ${i} failed with model "${model}":`, err);
    }
  }

  throw lastError;
}
