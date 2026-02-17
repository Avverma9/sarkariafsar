import ApiKey from "../models/ai/ai-apiKey.mjs";
import GeminiModel from "../models/ai/gemini-model.mjs";

const PROVIDER_ORDER =
  process.env.AI_PROVIDER_ORDER?.split(",").map((p) => p.trim()) ?? [
    "gemini"
  ];

const providerMap = {
  gemini: { Key: ApiKey, Model: GeminiModel },
};

const pickActive = async (provider, excludeKeyIds = []) => {
  const map = providerMap[provider];
  if (!map) return null;

  const model = await map.Model.findOne({ status: true }).sort({
    priority: -1,
    updatedAt: -1,
    createdAt: -1,
  });

  const key = await map.Key.findOne({
    status: { $in: ["ACTIVE", "INACTIVE"] },
    _id: { $nin: excludeKeyIds },
    $or: [{ provider }, { provider: { $exists: false } }],
  }).sort({
    // prefer ACTIVE first (lex order ACTIVE < INACTIVE)
    status: 1,
    priority: -1,
    failCount: 1,
    lastUsedAt: 1,
    createdAt: 1,
  });

  if (!model || !key) return null;

  return {
    provider,
    modelName: model.modelName,
    modelId: model._id,
    apiKey: key.apiKey,
    keyId: key._id,
  };
};

const getActiveAIConfig = async ({ excludeKeyIds = [] } = {}) => {
  for (const provider of PROVIDER_ORDER) {
    const pick = await pickActive(provider, excludeKeyIds);
    if (pick) {
      const map = providerMap[provider];
      const now = new Date();
      await Promise.all([
        map.Key.updateOne(
          { _id: pick.keyId },
          { $set: { lastUsedAt: now } }
        ),
        map.Model.updateOne(
          { _id: pick.modelId },
          { $set: { lastUsedAt: now } }
        ),
      ]);
      return pick;
    }
  }

  throw new Error("No active AI provider configured");
};

const markKeyFailure = async ({ provider, keyId, errorMessage = "" }) => {
  const map = providerMap[provider];
  if (!map || !keyId) return;
  const now = new Date();
  await map.Key.updateOne(
    { _id: keyId },
    {
      $set: {
        status: "INACTIVE",
        lastFailedAt: now,
        lastError: errorMessage,
      },
      $inc: { failCount: 1 },
    }
  );
};

const markKeySuccess = async ({ provider, keyId }) => {
  const map = providerMap[provider];
  if (!map || !keyId) return;
  const now = new Date();
  // set all keys of provider to INACTIVE, then activate the winner
  await map.Key.updateMany(
    { $or: [{ provider }, { provider: { $exists: false } }] },
    { $set: { status: "INACTIVE" } }
  );
  await map.Key.updateOne(
    { _id: keyId },
    {
      $set: { lastUsedAt: now, status: "ACTIVE" },
      $inc: { successCount: 1 },
    }
  );
};

export { getActiveAIConfig, markKeyFailure, markKeySuccess };
export default getActiveAIConfig;
