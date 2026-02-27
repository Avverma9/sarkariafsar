import govSchemeModel from "../models/govscheme.model.mjs";
import { readFile } from "node:fs/promises";

const getValue = (req, key, fallback = undefined) => {
  if (req?.body && req.body[key] !== undefined) return req.body[key];
  if (req?.query && req.query[key] !== undefined) return req.query[key];
  if (req?.params && req.params[key] !== undefined) return req.params[key];
  return fallback;
};

const toInteger = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
};

const toObject = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
};

const SCHEME_SEED_FILE_URL = new URL("../scheme.md", import.meta.url);
const SCHEME_SEED_LIMIT = 50;

const parseSeedSchemes = (rawContent = "") => {
  const content = String(rawContent || "").trim();
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const repaired = content.replace(/}\s*\n\s*{/g, "},\n{");
    const parsed = JSON.parse(repaired);
    return Array.isArray(parsed) ? parsed : [];
  }
};

const loadSeedSchemes = async () => {
  const raw = await readFile(SCHEME_SEED_FILE_URL, "utf8");
  const parsed = parseSeedSchemes(raw);
  return parsed
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .slice(0, SCHEME_SEED_LIMIT);
};

export const postGovSchemeController = async (req, res, next) => {
  try {
    const payload = toObject(req?.body || {});
    const scheme = await govSchemeModel.createScheme(payload);

    return res.status(201).json({
      message: "Scheme created",
      scheme,
    });
  } catch (error) {
    return next(error);
  }
};

export const getGovSchemeController = async (req, res, next) => {
  try {
    const id = String(req?.params?.id || getValue(req, "id", "")).trim();
    if (id) {
      const scheme = await govSchemeModel.getSchemeById(id);
      if (!scheme) {
        return res.status(404).json({ message: "Scheme not found", scheme: null });
      }
      return res.status(200).json({ scheme });
    }

    const data = await govSchemeModel.listSchemes({
      title: getValue(req, "title", ""),
      state: getValue(req, "state", ""),
      city: getValue(req, "city", ""),
      page: toInteger(getValue(req, "page"), 1),
      limit: toInteger(getValue(req, "limit"), 20),
    });

    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
};

export const getAllGovSchemesController = async (req, res, next) => {
  try {
    const schemes = await govSchemeModel.getAllSchemes();

    return res.status(200).json({
      total: schemes.length,
      schemes,
    });
  } catch (error) {
    return next(error);
  }
};

export const getGovSchemeStateNamesController = async (req, res, next) => {
  try {
    const states = await govSchemeModel.getStateNamesOnly();

    return res.status(200).json({
      total: states.length,
      states,
    });
  } catch (error) {
    return next(error);
  }
};

export const getGovSchemeByStateController = async (req, res, next) => {
  try {
    const state = String(
      getValue(req, "state", getValue(req, "sttate", ""))
    ).trim();

    if (!state) {
      throw new Error("state is required");
    }

    const schemes = await govSchemeModel.getSchemesByState({ state });

    return res.status(200).json({
      state,
      total: schemes.length,
      schemes,
    });
  } catch (error) {
    return next(error);
  }
};

export const patchGovSchemeController = async (req, res, next) => {
  try {
    const id = String(req?.params?.id || getValue(req, "id", "")).trim();
    if (!id) {
      throw new Error("id is required");
    }

    const payload = toObject(req?.body || {});
    const scheme = await govSchemeModel.patchSchemeById({ id, payload });

    if (!scheme) {
      return res.status(404).json({ message: "Scheme not found", scheme: null });
    }

    return res.status(200).json({
      message: "Scheme updated",
      scheme,
    });
  } catch (error) {
    return next(error);
  }
};

export const seedGovSchemeController = async (req, res, next) => {
  try {
    const seedPayload = await loadSeedSchemes();

    if (seedPayload.length === 0) {
      return res.status(200).json({
        message: "No schemes found to seed",
        total: 0,
        created: 0,
        updated: 0,
        skipped: 0,
      });
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const scheme of seedPayload) {
      const payload = toObject(scheme);
      const schemeTitle = String(payload.schemeTitle || payload.title || "").trim();
      const state = String(payload.state || "").trim();
      const city = String(payload.city || "").trim();

      if (!schemeTitle) {
        skipped += 1;
        continue;
      }

      const existing = await govSchemeModel.model.findOne({
        schemeTitle,
        state,
        city,
      });

      if (existing) {
        Object.assign(existing, payload);
        await existing.save();
        updated += 1;
        continue;
      }

      await govSchemeModel.createScheme(payload);
      created += 1;
    }

    return res.status(200).json({
      message: "Gov schemes seeded from scheme.md",
      total: seedPayload.length,
      created,
      updated,
      skipped,
    });
  } catch (error) {
    return next(error);
  }
};

export default {
  postGovSchemeController,
  getGovSchemeController,
  getAllGovSchemesController,
  getGovSchemeStateNamesController,
  getGovSchemeByStateController,
  patchGovSchemeController,
  seedGovSchemeController,
};
