const mongoose = require("mongoose");
const JobPost = require("../models/post");
const { postData } = require("../bulk-post");
const { applyNoIndexFlag } = require("../utils/thinContentCheck");
const { notifyPostSubscribers } = require("./notification");

/**
 * Detect meaningful changes between old and new post for notification message
 */
function detectChangeDescription(oldDoc, newData) {
  const changes = [];
  const oldApply = oldDoc?.applyLastDate ? new Date(oldDoc.applyLastDate).toDateString() : null;
  const newApply = newData?.applyLastDate ? new Date(newData.applyLastDate).toDateString() : null;
  if (newApply && oldApply !== newApply) changes.push(`Apply Last Date बदलकर ${newApply} हो गई`);
  if (newData?.totalVacancies !== undefined && oldDoc?.totalVacancies !== newData.totalVacancies)
    changes.push(`Total Vacancies: ${newData.totalVacancies}`);
  if (newData?.isActive !== undefined && oldDoc?.isActive !== newData.isActive)
    changes.push(newData.isActive ? 'Post अब Active है' : 'Post बंद हो गई');
  if (newData?.status !== undefined && oldDoc?.status !== newData.status)
    changes.push(`Status: ${newData.status}`);
  return changes.length ? changes.join(' | ') : 'Post में नया Update आया है';
}



const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeString = (value) => (typeof value === "string" ? value.trim() : value);

const normalizeStringArray = (arr = []) =>
  Array.isArray(arr)
    ? arr.filter((v) => typeof v === "string" && v.trim()).map((v) => v.trim())
    : [];

const generateSlug = (t = "") =>
  t.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") out[k] = v.trim();
    else if (Array.isArray(v)) out[k] = v.map((i) => (typeof i === "string" ? i.trim() : sanitizeObject(i)));
    else if (v && typeof v === "object") out[k] = sanitizeObject(v);
    else out[k] = v;
  }
  return out;
};

const sanitizeJobPostData = (input = {}, { isUpdate = false } = {}) => {
  const data = sanitizeObject({ ...input });
  for (const key of [
    "title","jobtitle","category","sectionName","sectionCanonicalUrl","language","status",
    "dedupeKey","advertisement_number","advertisementNumber","conducting_authority",
    "conductingAuthority","disclaimer",
    "examPreparationStrategy","syllabusBreakdown","physicalTestDetails",
    "selectionProcess","ageLimit","applicationFee","salary","location","totalVacancies",
    "authorName","authorProfileUrl","authorBio"
  ]) if (key in data) data[key] = normalizeString(data[key]);
  if ("tags" in data) data.tags = normalizeStringArray(data.tags);
  if ("slug" in data && typeof data.slug === "string") data.slug = generateSlug(data.slug);
  if (!isUpdate && !data.slug && data.title) data.slug = generateSlug(data.title);
  if ("applyLastDate" in data && data.applyLastDate) {
    const d = new Date(data.applyLastDate);
    if (Number.isNaN(d.getTime())) delete data.applyLastDate; else data.applyLastDate = d;
  }
  return data;
};

const validateCreatePayload = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) return "Valid data object is required";
  if (!data.title || !String(data.title).trim()) return "title is required";
  if (!data.slug && !data.title) return "slug or title is required";
  return null;
};

const validateUpdatePayload = (data) =>
  !data || typeof data !== "object" || Array.isArray(data) ? "Valid update data is required" : null;

const handleMongooseError = (error, res, label) => {
  console.error(label, error);
  if (error.code === 11000) {
    const key = Object.keys(error.keyPattern || {})[0] || "field";
    return res.status(409).json({ success: false, message: `${key} already exists` });
  }
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages[0] || "Validation failed", errors: messages });
  }
  if (error.name === "CastError") return res.status(400).json({ success: false, message: "Invalid data format" });
  return res.status(500).json({ success: false, message: error.message || "Internal server error" });
};

const createJobPost = async (jobData) => new JobPost(jobData).save();

exports.addJobPost = async (req, res) => {
  try {
    const { data: bodyData } = req.body || {};
    const data = bodyData ?? postData;
    if (!data) return res.status(400).json({ success: false, message: "Data is required" });
    if (Array.isArray(data)) {
      if (!data.length) return res.status(400).json({ success: false, message: "Data array cannot be empty" });
      const docs = data.map((i) => applyNoIndexFlag(sanitizeJobPostData(i?.post || i)));
      for (const d of docs) {
        const err = validateCreatePayload(d);
        if (err) return res.status(400).json({ success: false, message: err });
      }
      const created = await JobPost.insertMany(docs, { ordered: false });
      return res.status(201).json({ success: true, message: `${created.length} job posts created`, data: created });
    }
    const sanitized = applyNoIndexFlag(sanitizeJobPostData(data?.post || data));
    const err = validateCreatePayload(sanitized);
    if (err) return res.status(400).json({ success: false, message: err });
    const created = await createJobPost(sanitized);
    return res.status(201).json({ success: true, message: "Job post created", data: created });
  } catch (e) {
    return handleMongooseError(e, res, "Add job post error:");
  }
};

exports.getExpiringJobPostsReminder = async (req, res) => {
  try {
    const { days, page, limit, category, sectionCanonicalUrl } = req.query;
    const d = parseInt(days, 10), p = Math.max(parseInt(page, 10) || 1, 1), l = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    if (isNaN(d) || d < 0) return res.status(400).json({ success: false, message: "days must be non-negative" });
    const now = new Date(), s = new Date(now); s.setHours(0,0,0,0);
    const e = new Date(s); e.setDate(e.getDate() + d); e.setHours(23,59,59,999);
    const f = { applyLastDate: { $gte: s, $lte: e } };
    if (category) f.category = String(category).trim();
    if (sectionCanonicalUrl) f.sectionCanonicalUrl = String(sectionCanonicalUrl).trim();
    const skip = (p - 1) * l;
    const [posts, total] = await Promise.all([
      JobPost.find(f).sort({ applyLastDate: 1 }).skip(skip).limit(l),
      JobPost.countDocuments(f)
    ]);
    const data = posts.map((pItem) => {
      const applyDate = pItem.applyLastDate ? new Date(pItem.applyLastDate) : null;
      let daysLeft = null;
      if (applyDate) {
        const tmp = new Date(applyDate); tmp.setHours(23,59,59,999);
        daysLeft = Math.ceil((tmp - now) / 86400000);
      }
      return { ...pItem.toObject(), daysLeft };
    });
    res.status(200).json({
      success: true,
      message: `Found ${total} job posts expiring within ${d} day(s)`,
      data,
      reminder: { days: d, from: s, to: e, totalExpiringPosts: total },
      pagination: { total, page: p, limit: l, totalPages: Math.ceil(total / l) },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getAllJobPosts = async (req, res) => {
  try {
    const { page=1, limit=10, category, status, language, tag, search, sectionName } = req.query;
    const p = Math.max(parseInt(page, 10), 1), l = Math.min(Math.max(parseInt(limit, 10), 1), 100);
    const skip = (p - 1) * l;
    const f = {};
    if (category) f.category = category;
    if (status) f.status = status;
    if (language) f.language = language;
    if (tag) f.tags = tag;
    if (sectionName) f.sectionName = { $regex: String(sectionName).trim(), $options: "i" };
    if (search) f.$or = ["title","jobtitle","slug","dedupeKey","category","advertisement_number","advertisementNumber","conducting_authority","conductingAuthority","tags"]
      .map((k) => ({ [k]: { $regex: search, $options: "i" } }));

    const now = new Date();
    // Sort logic:
    //   Group 0 → upcoming applyLastDate (nearest first)
    //   Group 1 → no date / expired → sort by updatedAt DESC (most recently active first)
    const MAX_SORT_MS = 9007199254740991; // Number.MAX_SAFE_INTEGER

    const pipeline = [
      { $match: f },
      {
        $addFields: {
          _sortKey: {
            $cond: {
              if: { $and: [{ $gt: ["$applyLastDate", null] }, { $gte: ["$applyLastDate", now] }] },
              then: { $toLong: "$applyLastDate" },
              else: MAX_SORT_MS,
            },
          },
        },
      },
      { $sort: { _sortKey: 1, updatedAt: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: l }, { $project: { _sortKey: 0 } }],
          total: [{ $count: "count" }],
        },
      },
    ];

    const [result] = await JobPost.aggregate(pipeline);
    const items = result?.data || [];
    const total = result?.total?.[0]?.count || 0;

    res.status(200).json({ success: true, message: "Job posts fetched", data: items, pagination: { total, page: p, limit: l, totalPages: Math.ceil(total/l) }});
  } catch (e) { return handleMongooseError(e,res,"Get all job posts error:"); }
};

exports.getJobPostById = async (req,res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const doc = await JobPost.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: doc });
  } catch (e) { return handleMongooseError(e,res,"Get by ID error:"); }
};

exports.getJobPostBySlug = async (req,res) => {
  try {
    const { slug } = req.params;
    if (!slug?.trim()) return res.status(400).json({ success:false,message:"Slug required"});
    const doc = await JobPost.findOne({ slug: generateSlug(slug) });
    if (!doc) return res.status(404).json({ success:false,message:"Not found"});

    res.status(200).json({ success:true,data:doc });
  } catch(e){return handleMongooseError(e,res,"Get by slug error:");}
};

exports.getJobPostByDedupeKey = async (req,res) => {
  try {
    const { dedupeKey } = req.params;
    if (!dedupeKey?.trim()) return res.status(400).json({ success:false,message:"dedupeKey required"});
    const doc = await JobPost.findOne({ dedupeKey: dedupeKey.trim() });
    if (!doc) return res.status(404).json({ success:false,message:"Not found"});
    res.status(200).json({ success:true,data:doc });
  } catch(e){return handleMongooseError(e,res,"Get by dedupeKey error:");}
};

exports.updateJobPost = async (req,res) => {
  try {
    const { id } = req.params; const { data } = req.body;
    if (!isValidObjectId(id)) return res.status(400).json({ success:false,message:"Invalid ID"});
    const err = validateUpdatePayload(data); if (err) return res.status(400).json({ success:false,message:err});
    const sanitized = sanitizeJobPostData(data,{isUpdate:true});
    // Fetch old doc for change detection
    const oldDoc = await JobPost.findById(id).select('applyLastDate totalVacancies isActive status').lean();
    const updated = await JobPost.findByIdAndUpdate(id, sanitized, { new:true, runValidators:true });
    if (!updated) return res.status(404).json({ success:false,message:"Not found"});
    // re-compute noIndex after update
    const plain = updated.toObject();
    const flagged = applyNoIndexFlag(plain);
    if (flagged.noIndex !== updated.noIndex || flagged.wordCount !== updated.wordCount) {
      updated.noIndex = flagged.noIndex; updated.wordCount = flagged.wordCount;
      await updated.save();
    }
    res.status(200).json({ success:true,message:"Updated",data:updated });
    // Fire-and-forget: notify subscribers asynchronously
    const changeDesc = detectChangeDescription(oldDoc, data);
    notifyPostSubscribers(updated, changeDesc).catch(e => console.error('[Notify] auto error', e));
  } catch(e){return handleMongooseError(e,res,"Update error:");}
};

exports.updateJobPostBySlug = async (req,res) => {
  try {
    const { slug } = req.params; const { data } = req.body;
    if (!slug?.trim()) return res.status(400).json({ success:false,message:"Slug required"});
    const err = validateUpdatePayload(data); if (err) return res.status(400).json({ success:false,message:err});
    const updated = await JobPost.findOneAndUpdate({ slug: generateSlug(slug) }, sanitizeJobPostData(data,{isUpdate:true}), { new:true, runValidators:true });
    if (!updated) return res.status(404).json({ success:false,message:"Not found"});
    res.status(200).json({ success:true,message:"Updated",data:updated });
  } catch(e){return handleMongooseError(e,res,"Update by slug error:");}
};

exports.deleteJobPost = async (req,res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success:false,message:"Invalid ID"});
    const del = await JobPost.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ success:false,message:"Not found"});
    res.status(200).json({ success:true,message:"Deleted",data:del });
  } catch(e){return handleMongooseError(e,res,"Delete error:");}
};

exports.deleteJobPostBySlug = async (req,res) => {
  try {
    const { slug } = req.params;
    if (!slug?.trim()) return res.status(400).json({ success:false,message:"Slug required"});
    const del = await JobPost.findOneAndDelete({ slug: generateSlug(slug) });
    if (!del) return res.status(404).json({ success:false,message:"Not found"});
    res.status(200).json({ success:true,message:"Deleted",data:del });
  } catch(e){return handleMongooseError(e,res,"Delete by slug error:");}
};

exports.getPostsWithSection = async (req, res) => {
  try {
    const { sectionCanonicalUrl, sortBy = "sectionName", order = "asc" } = req.query;

    // optional section filter
    const sectionFilter = sectionCanonicalUrl
      ? { sectionCanonicalUrl: String(sectionCanonicalUrl).trim() }
      : { sectionCanonicalUrl: { $exists: true } };

    const sortOrder = order === "asc" ? 1 : -1;

    const pipeline = [
      // 1. Posts + section data merge
      {
        $lookup: {
          from: "jobsections",
          pipeline: [
            { $match: sectionFilter },
            { $project: { name: 1, canonicalUrl: 1 } }
          ],
          let: { secCanonical: "$sectionCanonicalUrl" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $and: [{ $ne: ["$$secCanonical", null] }, { $eq: ["$canonicalUrl", "$$secCanonical"] }] },
                    { $eq: ["$name", "$secName"] }
                  ]
                }
              }
            }
          ],
          as: "section"
        }
      },
      { $unwind: "$section" },

      // 2. group by section info
      {
        $group: {
          _id: {
            sectionName: "$section.name",
            sectionCanonicalUrl: "$section.canonicalUrl"
          },
          posts: {
            $push: {
              title: "$title",
              slug: "$slug",
              sectionName: "$section.name",
              sectionCanonicalUrl: "$section.canonicalUrl"
            }
          }
        }
      },

      // 3. sort sections
      { $sort: { "_id.sectionName": sortOrder } },

      // 4. reshape to flat array
      {
        $project: {
          sectionName: "$_id.sectionName",
          sectionCanonicalUrl: "$_id.sectionCanonicalUrl",
          posts: 1,
          _id: 0
        }
      }
    ];

    const sections = await JobPost.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      message: "Sections with posts",
      data: sections,
    });
  } catch (error) {
    console.error("get postsWithSection error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch sections with posts",
    });
  }
};


exports.getPostListBySectionCanonicalUrl = async (req,res) => {
  try {
    const { sectionCanonicalUrl } = req.params; const { page=1, limit=50, search, order="desc" } = req.query;
    if (!sectionCanonicalUrl?.trim()) return res.status(400).json({ success:false, message:"sectionCanonicalUrl required"});
    const p = Math.max(parseInt(page,10),1), l=Math.min(Math.max(parseInt(limit,10),1),200), skip=(p-1)*l;
    const filter={sectionCanonicalUrl:sectionCanonicalUrl.trim()};
    if(search) filter.$or=[{title:{$regex:search,$options:"i"}},{slug:{$regex:search,$options:"i"}}];
    const orderVal=order==="asc"?1:-1;
    const sortStage={updatedAt:orderVal,createdAt:orderVal};
    const pipeline=[{$match:filter},{$sort:sortStage},{$group:{_id:{slug:"$slug",sourceUrl:"$sourceUrl"},doc:{$first:"$$ROOT"}}},
      {$replaceRoot:{newRoot:"$doc"}},{$sort:sortStage},{$project:{title:1,slug:1,sectionName:1,sectionCanonicalUrl:1,sourceUrl:1,updatedAt:1}},
      {$skip:skip},{$limit:l}];
    const countPipe=[{$match:filter},{$group:{_id:{slug:"$slug",sourceUrl:"$sourceUrl"}}},{$count:"total"}];
    const [posts,count]=await Promise.all([JobPost.aggregate(pipeline),JobPost.aggregate(countPipe)]);
    const total=count[0]?.total||0;
    res.status(200).json({success:true,message:"Job post list fetched",data:posts,pagination:{total,page:p,limit:l,totalPages:Math.ceil(total/l)}});
  } catch(e){console.error(e);res.status(500).json({success:false,message:e.message});}
};

// ─── noIndex meta helper (frontend can call this to decide <meta robots>) ───
exports.getPostMeta = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug?.trim()) return res.status(400).json({ success: false, message: "Slug required" });
    const doc = await JobPost.findOne({ slug: generateSlug(slug) }, "slug title noIndex wordCount");
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: { slug: doc.slug, noIndex: doc.noIndex, wordCount: doc.wordCount } });
  } catch (e) { return handleMongooseError(e, res, "Post meta error:"); }
};

// ─── Sitemap endpoint — only slug + updatedAt, excludes thin/noIndex posts ───
exports.getSitemapPosts = async (req, res) => {
  try {
    const docs = await JobPost.find(
      { status: { $ne: 'draft' }, noIndex: { $ne: true } },
      "slug updatedAt"
    ).lean();
    res.status(200).json({ success: true, data: docs });
  } catch (e) { return handleMongooseError(e, res, "Sitemap posts error:"); }
};
