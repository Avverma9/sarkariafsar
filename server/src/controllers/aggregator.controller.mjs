import { AggregatorSite } from "../models/aggregator.model.mjs";

export const addSite = async (req, res, next) => {
  try {
    const { name, url } = req.body;
    if (!name || !url) {
      return res.status(400).json({ message: "Name and URL are required" });
    }

    const site = await AggregatorSite.create({ name, url });
    return res.status(201).json(site);
  } catch (error) {
    return next(error);
  }
};

export const getSites = async (req, res, next) => {
  try {
    const sites = await AggregatorSite.find();
    return res.status(200).json(sites);
  } catch (error) {
    return next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Invalid status value, allowed: active, inactive" });
    }

    const site = await AggregatorSite.findByIdAndUpdate(
      id,
      { status },
      { returnDocument: "after" },
    );
    if (!site) {
      return res.status(404).json({ message: "Site not found" });
    }

    return res.status(200).json(site);
  } catch (error) {
    return next(error);
  }
};

import MegaSection from "../models/megaSection.model.mjs";
import MegaPost from "../models/megaPost.model.mjs";
import PostDetail from "../models/postdetail.model.mjs";
import { triggerMegaSyncRun } from "../services/scraper.service.mjs";
import { clearFrontApiCacheBestEffort } from "../services/frontCache.service.mjs";

export const runMegaSyncNow = async (req, res, next) => {
  try {
    const postDelayMsRaw = req.body?.postDelayMs ?? req.query?.postDelayMs;
    const postDelayMs =
      postDelayMsRaw === undefined
        ? 0
        : Math.max(0, Number(postDelayMsRaw) || 0);

    const result = await triggerMegaSyncRun({
      reason: "api-sync-now",
      postDelayMs,
    });

    if (!result.accepted) {
      return res.status(202).json({
        success: true,
        queued: false,
        message: `Sync skipped: ${result.reason}`,
        reason: result.reason,
      });
    }

    return res.status(202).json({
      success: true,
      queued: true,
      message: "Sync-now started in background worker",
      postDelayMs,
      workerThreadId: result.workerThreadId,
    });
  } catch (err) {
    next(err);
  }
};

export const getMegaSections = async (req, res, next) => {
  try {
    const sections = await MegaSection.find().sort({ createdAt: 1 }).lean();
    return res.json({ success: true, count: sections.length, data: sections });
  } catch (err) {
    next(err);
  }
};

export const getMegaPosts = async (req, res, next) => {
  try {
    const { slug, page = 1, limit = 20 } = req.query;

    const q = {};
    if (slug) q.megaSlug = slug;

    const pageNum = Math.max(1, Number(page));
    const lim = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * lim;

    const [items, total] = await Promise.all([
      MegaPost.find(q).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
      MegaPost.countDocuments(q),
    ]);

    return res.json({
      success: true,
      pagination: {
        total,
        page: pageNum,
        limit: lim,
        pages: Math.ceil(total / lim),
      },
      data: items,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteMegaPostsBySourceSiteName = async (req, res, next) => {
  try {
    const sourceSiteName = String(
      req.body?.sourceSiteName || req.query?.sourceSiteName || "",
    ).trim();

    if (!sourceSiteName) {
      return res.status(400).json({
        success: false,
        message: "sourceSiteName is required",
      });
    }

    const postIds = await MegaPost.find({ sourceSiteName })
      .select("_id")
      .lean();

    if (!postIds.length) {
      return res.status(200).json({
        success: true,
        sourceSiteName,
        deletedMegaPosts: 0,
        deletedPostDetails: 0,
        message: "No MegaPosts found for this sourceSiteName",
      });
    }

    const megaPostIdList = postIds.map((row) => row._id);

    const [megaDeleteResult, detailDeleteResult] = await Promise.all([
      MegaPost.deleteMany({ _id: { $in: megaPostIdList } }),
      PostDetail.deleteMany({ megaPostId: { $in: megaPostIdList } }),
    ]);

    void clearFrontApiCacheBestEffort({ reason: "mega-post-delete-by-source-site" });

    return res.status(200).json({
      success: true,
      sourceSiteName,
      deletedMegaPosts: megaDeleteResult.deletedCount || 0,
      deletedPostDetails: detailDeleteResult.deletedCount || 0,
    });
  } catch (err) {
    next(err);
  }
};

export const postListBysectionUrl = async (req, res, next) => {
  try {
    const megaTitle = String(req.query?.megaTitle || req.body?.megaTitle || "").trim();
    const sectionUrl = String(req.query?.sectionUrl || req.body?.sectionUrl || "").trim();
    const pageNum = Math.max(1, Number(req.query?.page || req.body?.page || 1));
    const lim = Math.min(500, Math.max(1, Number(req.query?.limit || req.body?.limit || 100)));
    const skip = (pageNum - 1) * lim;

    if (!megaTitle) {
      return res
        .status(400)
        .json({ success: false, message: "megaTitle is required" });
    }

    const hiddenTitleRegexes = [
      /^answer\s*key$/i,
      /^admit\s*card$/i,
      /^latest\s*job$/i,
      /^sarkari\s*result$/i,
      /^let[’']?s\s*update$/i,
      /^skip\s*to\s*content$/i,
      /sarkariresult\.com\.cm/i,
      /sarkariexam\.com/i,
      /rojgarresult\.com/i,
    ];

    const match = {
      megaTitle,
      $nor: hiddenTitleRegexes.map((rx) => ({ title: { $regex: rx } })),
    };
    if (sectionUrl) match.sourceSectionUrl = sectionUrl;

    const [rows, totalRows] = await Promise.all([
      MegaPost.aggregate([
        { $match: match },
        {
          $lookup: {
            from: "postdetails",
            localField: "_id",
            foreignField: "megaPostId",
            as: "postDetail",
          },
        },
        {
          $set: {
            postDetail: { $first: "$postDetail" },
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            canonicalKey: 1,
            megaTitle: 1,
            megaSlug: 1,
            originalUrl: 1,
            sourceSectionUrl: 1,
            postDate: "$createdAt",
            applicationLastDate: {
              $ifNull: [
                "$postDetail.formattedData.recruitment.importantDates.applicationLastDate",
                "$postDetail.formattedData.recruitment.applicationLastDate",
              ],
            },
          },
        },
      ]),
      MegaPost.countDocuments(match),
    ]);

    const sortedRows = rows
      .map((row) => {
        const deadline = parseFlexibleDate(row.applicationLastDate);
        const deadlineTs = deadline ? normalizeToday(deadline).getTime() : -1;
        const postDateTs = Number.isNaN(new Date(row.postDate).getTime())
          ? 0
          : new Date(row.postDate).getTime();
        return {
          ...row,
          _deadlineSortTs: deadlineTs,
          _postDateSortTs: postDateTs,
        };
      })
      .sort((a, b) => {
        if (b._deadlineSortTs !== a._deadlineSortTs) {
          return b._deadlineSortTs - a._deadlineSortTs;
        }
        return b._postDateSortTs - a._postDateSortTs;
      });

    const pagedRows = sortedRows.slice(skip, skip + lim);

    return res.json({
      success: true,
      count: pagedRows.length,
      pagination: {
        total: totalRows,
        page: pageNum,
        limit: lim,
        pages: Math.ceil(totalRows / lim),
      },
      data: pagedRows.map((r) => ({
        postId: String(r._id),
        title: r.title,
        canonicalKey: r.canonicalKey,
        megaTitle: r.megaTitle,
        megaSlug: r.megaSlug,
        sourceUrl: r.originalUrl,
        sectionUrl: r.sourceSectionUrl,
        postDate: r.postDate,
        applicationLastDate: String(r.applicationLastDate || "").trim(),
      })),
    });
  } catch (err) {
    next(err);
  }
};

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function inferJobType(megaSlug, title) {
  const slug = String(megaSlug || "").toLowerCase();
  const t = String(title || "").toLowerCase();

  if (slug === "answer-keys" || /\banswer\s*key\b/.test(t)) return "ANSWER_KEY";
  if (slug === "recent-results" || /\bresult\b/.test(t)) return "RESULT";
  if (slug === "admit-cards" || /\badmit\s*card\b/.test(t)) return "ADMIT_CARD";
  if (/\bcorrection\b/.test(t)) return "CORRECTION";
  if (/\bdocument\s*verification\b|\bdv\b/.test(t)) return "DV";
  if (/\bcounselling\b|\binterview\b/.test(t)) return "COUNSELLING";
  if (/\bmerit\b/.test(t)) return "MERIT";
  if (slug === "admission-form" || /\badmission\b/.test(t)) return "ADMISSION";
  return "APPLICATION";
}

export const findMegaPostsByTitle = async (req, res, next) => {
  try {
    const title = String(req.query?.title || req.body?.title || "").trim();
    const megaSlug = String(req.query?.megaSlug || req.body?.megaSlug || "").trim();
    const sectionUrl = String(req.query?.sectionUrl || req.body?.sectionUrl || "").trim();
    const exact = String(req.query?.exact || req.body?.exact || "").trim().toLowerCase() === "true";
    const pageNum = Math.max(1, Number(req.query?.page || req.body?.page || 1));
    const lim = Math.min(200, Math.max(1, Number(req.query?.limit || req.body?.limit || 20)));
    const skip = (pageNum - 1) * lim;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "title is required",
      });
    }

    const escaped = escapeRegex(title);
    const match = {
      title: exact
        ? { $regex: `^${escaped}$`, $options: "i" }
        : { $regex: escaped, $options: "i" },
    };
    if (megaSlug) match.megaSlug = megaSlug;
    if (sectionUrl) match.sourceSectionUrl = sectionUrl;

    const [rows, totalRows] = await Promise.all([
      MegaPost.aggregate([
        { $match: match },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: lim },
        {
          $lookup: {
            from: "postdetails",
            localField: "_id",
            foreignField: "megaPostId",
            as: "postDetail",
          },
        },
        {
          $set: {
            postDetail: { $first: "$postDetail" },
          },
        },
        {
          $project: {
            _id: 1,
            postDetailId: "$postDetail._id",
            title: 1,
            canonicalKey: 1,
            megaSlug: 1,
            megaTitle: 1,
            originalUrl: 1,
            sourceSectionUrl: 1,
            createdAt: 1,
            isFavorite: 1,
            applicationLastDate: {
              $ifNull: [
                "$postDetail.formattedData.recruitment.importantDates.applicationLastDate",
                "$postDetail.formattedData.recruitment.applicationLastDate",
              ],
            },
          },
        },
      ]),
      MegaPost.countDocuments(match),
    ]);

    return res.json({
      success: true,
      count: rows.length,
      pagination: {
        total: totalRows,
        page: pageNum,
        limit: lim,
        pages: Math.ceil(totalRows / lim),
      },
      data: rows.map((r) => ({
        postId: String(r._id),
        postDetailId: String(r.postDetailId || ""),
        title: r.title,
        canonicalKey: r.canonicalKey,
        megaSlug: r.megaSlug,
        megaTitle: r.megaTitle,
        sourceUrl: r.originalUrl,
        sectionUrl: r.sourceSectionUrl,
        postDate: r.createdAt,
        isFavorite: r.isFavorite === true,
        applicationLastDate: String(r.applicationLastDate || "").trim(),
        jobType: inferJobType(r.megaSlug, r.title),
      })),
    });
  } catch (err) {
    next(err);
  }
};

function parseFlexibleDate(input) {
  if (input instanceof Date && !Number.isNaN(input.getTime())) {
    return input;
  }

  const raw = String(input || "").trim();
  if (!raw) return null;

  const buildDate = (year, month, day) => {
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
    const date = new Date(y, m - 1, d);
    if (
      date.getFullYear() !== y ||
      date.getMonth() !== m - 1 ||
      date.getDate() !== d
    ) {
      return null;
    }
    return date;
  };

  // Accept full-string and embedded date formats:
  // yyyy-mm-dd, yyyy/mm/dd, yyyy.mm.dd
  let m = raw.match(/(?:^|\D)(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:\D|$)/);
  if (m) {
    return buildDate(m[1], m[2], m[3]);
  }

  // dd-mm-yyyy, dd/mm/yyyy, dd.mm.yyyy
  m = raw.match(/(?:^|\D)(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:\D|$)/);
  if (m) {
    return buildDate(m[3], m[2], m[1]);
  }

  const direct = new Date(raw);
  return Number.isNaN(direct.getTime()) ? null : direct;
}

function normalizeToday(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayDiff(fromDate, toDate) {
  const ms = 24 * 60 * 60 * 1000;
  return Math.round((toDate.getTime() - fromDate.getTime()) / ms);
}

export const markJobFavorite = async (req, res, next) => {
  try {
    const canonicalKey = String(req.body?.canonicalKey || "").trim();
    const megaSlug = String(req.body?.megaSlug || "").trim();
    const isFavorite = req.body?.isFavorite !== false;

    if (!canonicalKey) {
      return res.status(400).json({ success: false, message: "canonicalKey is required" });
    }

    const match = { canonicalKey };
    if (megaSlug) match.megaSlug = megaSlug;

    const post = await MegaPost.findOne(match).select("_id");
    if (!post) {
      return res.status(404).json({ success: false, message: "MegaPost not found" });
    }

    const updated = await MegaPost.findByIdAndUpdate(
      post._id,
      {
        $set: {
          isFavorite,
          favoriteMarkedAt: isFavorite ? new Date() : null,
        },
      },
      {
        returnDocument: "after",
      },
    ).select("_id canonicalKey megaSlug megaTitle title isFavorite favoriteMarkedAt");

    void clearFrontApiCacheBestEffort({
      reason: isFavorite ? "favorite-marked" : "favorite-unmarked",
    });

    return res.json({
      success: true,
      isFavorite: updated?.isFavorite === true,
      message: isFavorite ? "Marked as favorite" : "Removed from favorites",
      data: {
        postId: String(updated?._id || ""),
        canonicalKey: updated?.canonicalKey || canonicalKey,
        megaSlug: updated?.megaSlug || "",
        megaTitle: updated?.megaTitle || "",
        title: updated?.title || "",
        favoriteMarkedAt: updated?.favoriteMarkedAt || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getFavoriteJobs = async (req, res, next) => {
  try {
    const megaSlug = String(req.query?.megaSlug || req.body?.megaSlug || "").trim();
    const pageNum = Math.max(1, Number(req.query?.page || req.body?.page || 1));
    const lim = Math.min(200, Math.max(1, Number(req.query?.limit || req.body?.limit || 20)));
    const skip = (pageNum - 1) * lim;

    const match = {
      $or: [
        { isFavorite: true },
        { isFavorite: { $exists: false }, isFavourite: true },
      ],
    };
    if (megaSlug) match.megaSlug = megaSlug;

    const [rows, totalRows] = await Promise.all([
      MegaPost.aggregate([
        { $match: match },
        { $sort: { favoriteMarkedAt: -1, updatedAt: -1, createdAt: -1 } },
        {
          $lookup: {
            from: "postdetails",
            let: {
              megaPostId: "$_id",
              canonicalKey: "$canonicalKey",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$megaPostId", "$$megaPostId"] },
                      { $eq: ["$canonicalKey", "$$canonicalKey"] },
                    ],
                  },
                },
              },
              { $sort: { updatedAt: -1, createdAt: -1 } },
              { $limit: 1 },
            ],
            as: "postDetail",
          },
        },
        {
          $set: {
            postDetail: { $first: "$postDetail" },
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            canonicalKey: 1,
            megaSlug: 1,
            megaTitle: 1,
            originalUrl: 1,
            sourceSectionUrl: 1,
            createdAt: 1,
            isFavorite: 1,
            isFavourite: 1,
            favoriteMarkedAt: 1,
            recruitmentTitle: {
              $ifNull: [
                "$postDetail.formattedData.recruitment.title",
                "$title",
              ],
            },
            applicationLastDate: {
              $ifNull: [
                "$postDetail.formattedData.recruitment.importantDates.applicationLastDate",
                "$postDetail.formattedData.recruitment.applicationLastDate",
              ],
            },
            organizationShortName: {
              $ifNull: [
                "$postDetail.formattedData.recruitment.organization.shortName",
                "$postDetail.formattedData.recruitment.organization.shortname",
              ],
            },
          },
        },
        { $skip: skip },
        { $limit: lim },
      ]),
      MegaPost.countDocuments(match),
    ]);

    return res.json({
      success: true,
      count: rows.length,
      pagination: {
        total: totalRows,
        page: pageNum,
        limit: lim,
        pages: Math.ceil(totalRows / lim),
      },
      data: rows.map((r) => ({
        postId: String(r._id),
        title: r.title,
        canonicalKey: r.canonicalKey,
        megaSlug: r.megaSlug,
        megaTitle: r.megaTitle,
        sourceUrl: r.originalUrl,
        sectionUrl: r.sourceSectionUrl,
        postDate: r.createdAt,
        isFavorite:
          r.isFavorite === true ||
          (r.isFavorite !== false && r.isFavourite === true),
        favoriteMarkedAt: r.favoriteMarkedAt || null,
        recruitmentTitle: String(r.recruitmentTitle || "").trim(),
        applicationLastDate: String(r.applicationLastDate || "").trim(),
        organizationShortName: String(r.organizationShortName || "").trim(),
        recruitment: {
          title: String(r.recruitmentTitle || "").trim(),
          organization: {
            shortName: String(r.organizationShortName || "").trim(),
          },
        },
        jobType: inferJobType(r.megaSlug, r.title),
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const getDeadlineJobs = async (req, res, next) => {
  try {
    const days = Math.max(0, Number(req.query?.days || req.body?.days || 3));
    const pageNum = Math.max(1, Number(req.query?.page || req.body?.page || 1));
    const lim = Math.min(500, Math.max(1, Number(req.query?.limit || req.body?.limit || 50)));

    const rows = await PostDetail.aggregate([
      {
        $lookup: {
          from: "megaposts",
          localField: "megaPostId",
          foreignField: "_id",
          as: "post",
        },
      },
      { $set: { post: { $first: "$post" } } },
      { $match: { "post._id": { $exists: true } } },
      {
        $project: {
          _id: 0,
          megaPostId: "$post._id",
          canonicalKey: "$post.canonicalKey",
          megaSlug: "$post.megaSlug",
          megaTitle: "$post.megaTitle",
          title: "$post.title",
          sourceUrl: "$post.originalUrl",
          applicationLastDate: {
            $ifNull: [
              "$formattedData.recruitment.importantDates.applicationLastDate",
              "$formattedData.recruitment.applicationLastDate",
            ],
          },
        },
      },
      {
        $match: {
          applicationLastDate: { $type: "string", $ne: "" },
        },
      },
    ]);

    const today = normalizeToday();
    const filtered = [];

    for (const row of rows) {
      const applicationLastDate = String(row.applicationLastDate || "").trim();
      if (!applicationLastDate) continue;

      const deadlineDate = parseFlexibleDate(applicationLastDate);
      if (!deadlineDate) continue;

      const d = normalizeToday(deadlineDate);
      const left = dayDiff(today, d);
      if (left < 0 || left > days) continue;

      filtered.push({
        ...row,
        daysLeft: left,
        deadlineDate: d.toISOString().slice(0, 10),
      });
    }

    filtered.sort((a, b) => a.daysLeft - b.daysLeft);

    const total = filtered.length;
    const skip = (pageNum - 1) * lim;
    const data = filtered.slice(skip, skip + lim);

    return res.json({
      success: true,
      query: { days, page: pageNum, limit: lim },
      count: data.length,
      pagination: {
        total,
        page: pageNum,
        limit: lim,
        pages: Math.ceil(total / lim),
      },
      data,
    });
  } catch (err) {
    next(err);
  }
};
