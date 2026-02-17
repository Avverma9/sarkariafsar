import GeminiModel from "../models/gemini.model.mjs";
import ApiKey from "../models/apikey.model.mjs";

/**
 * Helpers
 */
const normModelName = (name) => String(name || "").trim().toLowerCase();
const normKey = (k) => String(k || "").trim();
const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const sendError = (res, code, message, extra = {}) =>
  res.status(code).json({ success: false, message, ...extra });

// ✅ Match your schema enums exactly
const ALLOWED_KEY_STATUS = new Set(["ACTIVE", "DISABLED", "INACTIVE"]);
const normalizeKeyStatus = (s) => {
  const v = String(s || "ACTIVE").trim().toUpperCase();
  return ALLOWED_KEY_STATUS.has(v) ? v : "ACTIVE";
};

// ✅ ACTIVE first sort order (custom)
const KEY_STATUS_ORDER = { ACTIVE: 0, DISABLED: 1, INACTIVE: 2 };
const sortKeysByStatusPriority = (keys = []) =>
  keys.sort((a, b) => {
    const sa = KEY_STATUS_ORDER[a.status] ?? 9;
    const sb = KEY_STATUS_ORDER[b.status] ?? 9;
    if (sa !== sb) return sa - sb; // ACTIVE first
    if ((b.priority ?? 0) !== (a.priority ?? 0)) return (b.priority ?? 0) - (a.priority ?? 0);
    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
  });

/**
 * Controllers
 */

const changeStatus = async (req, res) => {
  try {
    const modelName = normModelName(req.body?.modelName);
    const status = req.body?.status;

    if (!modelName || typeof status !== "boolean") {
      return sendError(res, 400, "modelName and boolean status are required");
    }

    const modelRecord = await GeminiModel.findOneAndUpdate(
      { modelName },
      { $set: { status } },
      { returnDocument: "after", runValidators: true }
    );

    if (!modelRecord) {
      return sendError(res, 404, "Model not found in database");
    }

    return res.json({
      success: true,
      message: "Model status updated successfully",
      model: modelRecord,
    });
  } catch (err) {
    return sendError(res, 500, err.message || "Internal server error");
  }
};

const setModel = async (req, res) => {
  try {
    const modelName = normModelName(req.body?.modelName);
    const status = req.body?.status;
    const priority = toNumber(req.body?.priority, 0);

    if (!modelName) {
      return sendError(res, 400, "modelName is required");
    }

    const modelRecord = await GeminiModel.findOneAndUpdate(
      { modelName },
      { $set: { status: typeof status === "boolean" ? status : true, priority } },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: "Model saved",
      model: modelRecord,
    });
  } catch (err) {
    return sendError(res, 500, err.message || "Internal server error");
  }
};

const getModel = async (req, res) => {
  try {
    const models = await GeminiModel.find().sort({
      priority: -1,
      updatedAt: -1,
      createdAt: -1,
    });

    return res.json({ success: true, models });
  } catch (err) {
    return sendError(res, 500, err.message || "Internal server error");
  }
};

const setApiKey = async (req, res) => {
  try {
    const apiKey = normKey(req.body?.apiKey);
    const label = String(req.body?.label || "").trim();
    const priority = toNumber(req.body?.priority, 0);
    const status = normalizeKeyStatus(req.body?.status);

    if (!apiKey) {
      return sendError(res, 400, "apiKey is required");
    }

    // ✅ Unique index is { provider, apiKey } so query must include provider too
    const apiKeyRecord = await ApiKey.findOneAndUpdate(
      { provider: "gemini", apiKey },
      {
        $set: {
          provider: "gemini",
          apiKey,
          status,
          label,
          priority,
        },
      },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    // fetch + custom sort (ACTIVE first)
    const keysRaw = await ApiKey.find({ provider: "gemini" }).lean();
    const keys = sortKeysByStatusPriority(keysRaw);

    return res.json({
      success: true,
      message: "API key saved",
      apiKey: apiKeyRecord,
      keys,
    });
  } catch (err) {
    // ✅ duplicate key error safe message
    if (err?.code === 11000) {
      return sendError(res, 409, "API key already exists for provider gemini");
    }
    return sendError(res, 500, err.message || "Internal server error");
  }
};

const setApiKeysBulk = async (req, res) => {
  try {
    const keys = Array.isArray(req.body?.keys) ? req.body.keys : [];
    if (!keys.length) {
      return sendError(res, 400, "keys array is required");
    }

    const ops = [];
    for (const item of keys) {
      const apiKey = normKey(item?.apiKey);
      if (!apiKey) continue;

      ops.push({
        updateOne: {
          filter: { provider: "gemini", apiKey },
          update: {
            $set: {
              provider: "gemini",
              apiKey,
              label: String(item?.label || "").trim(),
              priority: toNumber(item?.priority, 0),
              status: normalizeKeyStatus(item?.status),
              successCount: toNumber(item?.successCount, 0),
              failCount: toNumber(item?.failCount, 0),
              lastError: item?.lastError ? String(item.lastError) : "",
              lastUsedAt: item?.lastUsedAt ? new Date(item.lastUsedAt) : undefined,
              lastFailedAt: item?.lastFailedAt
                ? new Date(item.lastFailedAt)
                : undefined,
              updatedAt: item?.updatedAt ? new Date(item.updatedAt) : undefined,
              createdAt: item?.createdAt ? new Date(item.createdAt) : undefined,
            },
          },
          upsert: true,
        },
      });
    }

    if (!ops.length) {
      return sendError(res, 400, "No valid apiKey found in keys array");
    }

    await ApiKey.bulkWrite(ops, { ordered: false });

    const keysRaw = await ApiKey.find({ provider: "gemini" }).lean();
    const sorted = sortKeysByStatusPriority(keysRaw);

    return res.json({
      success: true,
      message: "API keys upserted",
      count: ops.length,
      keys: sorted,
    });
  } catch (err) {
    return sendError(res, 500, err.message || "Internal server error");
  }
};

const getApiKey = async (req, res) => {
  try {
    const keysRaw = await ApiKey.find({ provider: "gemini" }).lean();
    const keys = sortKeysByStatusPriority(keysRaw);

    return res.json({ success: true, keys });
  } catch (err) {
    return sendError(res, 500, err.message || "Internal server error");
  }
};

export { getModel, setModel, getApiKey, setApiKey, setApiKeysBulk, changeStatus };
