import axios from "axios";

const PERPLEXITY_API_URL = String(
  process.env.PERPLEXITY_API_URL || "https://api.perplexity.ai/chat/completions",
).trim();
const PERPLEXITY_MODEL = String(process.env.PERPLEXITY_MODEL || "sonar").trim();
const MAX_TEXT_WORDS = Math.max(
  20,
  Number(process.env.PERPLEXITY_DEDUP_MAX_TEXT_WORDS || 100),
);
const MAX_TEXT_CHARS = Math.max(
  220,
  Number(process.env.PERPLEXITY_DEDUP_MAX_TEXT_CHARS || 700),
);
const MAX_OUTPUT_TOKENS = Math.max(
  10,
  Number(process.env.PERPLEXITY_DEDUP_MAX_OUTPUT_TOKENS || 24),
);

function trimForPrompt(text) {
  const raw = String(text || "").replace(/\s+/g, " ").trim();
  if (!raw) return "";

  const words = raw.split(" ").filter(Boolean);
  const slicedWords = words.slice(0, MAX_TEXT_WORDS);
  let clipped = slicedWords.join(" ").trim();

  if (clipped.length > MAX_TEXT_CHARS) {
    clipped = clipped.slice(0, MAX_TEXT_CHARS).trim();
  }

  return clipped;
}

function parseSimilarityPayload(rawText) {
  const text = String(rawText || "").trim();
  if (!text) {
    return { similarity: 0, isDuplicate: false };
  }

  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    const similarity = Math.max(
      0,
      Math.min(100, Number(parsed?.similarity ?? parsed?.score ?? 0)),
    );
    const isDuplicate = parsed?.isDuplicate === true || similarity >= 70;
    return { similarity, isDuplicate };
  } catch {
    const numeric = cleaned.match(/(\d{1,3}(?:\.\d+)?)/);
    const similarity = numeric
      ? Math.max(0, Math.min(100, Number(numeric[1])))
      : 0;
    const duplicateHint = /\b(true|yes|duplicate)\b/i.test(cleaned);
    return {
      similarity,
      isDuplicate: duplicateHint || similarity >= 70,
    };
  }
}

export async function compareContentSimilarityWithPerplexity({
  titleA = "",
  contentA = "",
  titleB = "",
  contentB = "",
  threshold = 70,
}) {
  const apiKey = String(process.env.PERPLEXITY_API_KEY || "").trim();
  if (!apiKey) {
    return {
      available: false,
      similarity: 0,
      isDuplicate: false,
      reason: "missing-api-key",
    };
  }

  const a = trimForPrompt(contentA);
  const b = trimForPrompt(contentB);
  if (!a || !b) {
    return {
      available: true,
      similarity: 0,
      isDuplicate: false,
      reason: "missing-content",
    };
  }

  const normalizedThreshold = Math.max(1, Math.min(100, Number(threshold || 70)));
  const prompt = [
    `Task: decide duplicate. threshold=${normalizedThreshold}.`,
    'Return strict JSON only: {"similarity":number,"isDuplicate":boolean}',
    `A_TITLE: ${String(titleA || "").slice(0, 180)}`,
    `A_TEXT: ${a}`,
    `B_TITLE: ${String(titleB || "").slice(0, 180)}`,
    `B_TEXT: ${b}`,
  ].join("\n");

  const { data } = await axios.post(
    PERPLEXITY_API_URL,
    {
      model: PERPLEXITY_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a strict deduplication scorer. Reply with compact JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0,
    },
    {
      timeout: 45000,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  const rawResponse = String(data?.choices?.[0]?.message?.content || "").trim();
  const parsed = parseSimilarityPayload(rawResponse);
  return {
    available: true,
    similarity: parsed.similarity,
    isDuplicate: parsed.isDuplicate && parsed.similarity >= normalizedThreshold,
    reason: "ok",
    rawResponse,
  };
}
