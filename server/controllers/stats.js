const GovScheme = require("../models/schemes");
const Blog = require("../models/blog");
const JobPost = require("../models/post");

const getSchemesCount = async (req, res) => {
  try {
    const count = await GovScheme.countDocuments();
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getBlogsCount = async (req, res) => {
  try {
    const count = await Blog.countDocuments();
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getPostsCount = async (req, res) => {
  try {
    const count = await JobPost.countDocuments();
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getPostsAdvancedStats = async (req, res) => {
  try {
    const byOrganization = await JobPost.aggregate([
      {
        $addFields: {
          _org: {
            $switch: {
              branches: [
                // Most specific first to avoid overlap
                { case: { $regexMatch: { input: "$title", regex: /^UPSSSC/i } }, then: "UPSSSC" },
                { case: { $regexMatch: { input: "$title", regex: /^UPPSC/i } }, then: "UPPSC" },
                { case: { $regexMatch: { input: "$title", regex: /^UPSC/i } }, then: "UPSC" },
                { case: { $regexMatch: { input: "$title", regex: /^UP Police/i } }, then: "UP Police" },
                { case: { $regexMatch: { input: "$title", regex: /BPSSC/i } }, then: "BPSSC (Bihar Police)" },
                { case: { $regexMatch: { input: "$title", regex: /^BPSC|Bihar BPSC/i } }, then: "BPSC" },
                { case: { $regexMatch: { input: "$title", regex: /^BSSC/i } }, then: "BSSC" },
                { case: { $regexMatch: { input: "$title", regex: /^BTSC|Bihar BTSC/i } }, then: "BTSC" },
                { case: { $regexMatch: { input: "$title", regex: /^BSEB|Bihar BSEB|Bihar Board/i } }, then: "Bihar Board (BSEB)" },
                { case: { $regexMatch: { input: "$title", regex: /^Bihar SHS/i } }, then: "Bihar SHS" },
                { case: { $regexMatch: { input: "$title", regex: /^CSBC|Bihar Police CSBC/i } }, then: "CSBC (Bihar Police)" },
                { case: { $regexMatch: { input: "$title", regex: /^Bihar/i } }, then: "Bihar (Other)" },
                { case: { $regexMatch: { input: "$title", regex: /^SSC(?!B)/i } }, then: "SSC" },
                { case: { $regexMatch: { input: "$title", regex: /^RRB|^RRC|^Railway/i } }, then: "Railway (RRB/RRC)" },
                { case: { $regexMatch: { input: "$title", regex: /^NTA/i } }, then: "NTA" },
                { case: { $regexMatch: { input: "$title", regex: /^RSSB|Rajasthan RSSB/i } }, then: "RSSB (Rajasthan)" },
                { case: { $regexMatch: { input: "$title", regex: /^RPSC/i } }, then: "RPSC" },
                { case: { $regexMatch: { input: "$title", regex: /^Rajasthan Police/i } }, then: "Rajasthan Police" },
                { case: { $regexMatch: { input: "$title", regex: /^Rajasthan Board/i } }, then: "Rajasthan Board" },
                { case: { $regexMatch: { input: "$title", regex: /^MPESB/i } }, then: "MPESB (MP)" },
                { case: { $regexMatch: { input: "$title", regex: /^MPPSC/i } }, then: "MPPSC (MP)" },
                { case: { $regexMatch: { input: "$title", regex: /^MP Board/i } }, then: "MP Board" },
                { case: { $regexMatch: { input: "$title", regex: /^Madhya Pradesh/i } }, then: "MPPSC (MP)" },
                { case: { $regexMatch: { input: "$title", regex: /^IBPS/i } }, then: "IBPS" },
                { case: { $regexMatch: { input: "$title", regex: /^SBI/i } }, then: "SBI" },
                { case: { $regexMatch: { input: "$title", regex: /^RBI/i } }, then: "RBI" },
                { case: { $regexMatch: { input: "$title", regex: /^Bank of Baroda|^Central Bank|^Union Bank|^PNB Bank|^HDFC Bank|^Nainital Bank|^Indian Overseas Bank|^IDBI Bank/i } }, then: "Bank (PSU/Private)" },
                { case: { $regexMatch: { input: "$title", regex: /^NABARD/i } }, then: "NABARD" },
                { case: { $regexMatch: { input: "$title", regex: /^JPSC/i } }, then: "JPSC (Jharkhand)" },
                { case: { $regexMatch: { input: "$title", regex: /^JSSC|Jharkhand JSSC/i } }, then: "JSSC (Jharkhand)" },
                { case: { $regexMatch: { input: "$title", regex: /^JCECEB|^Jharkhand/i } }, then: "Jharkhand (Other)" },
                { case: { $regexMatch: { input: "$title", regex: /^BSF/i } }, then: "BSF" },
                { case: { $regexMatch: { input: "$title", regex: /^SSB/i } }, then: "SSB" },
                { case: { $regexMatch: { input: "$title", regex: /^Indian Army|^Army/i } }, then: "Indian Army" },
                { case: { $regexMatch: { input: "$title", regex: /^Indian Navy/i } }, then: "Indian Navy" },
                { case: { $regexMatch: { input: "$title", regex: /^Indian Air|^IAF|^AFCAT/i } }, then: "Indian Air Force" },
                { case: { $regexMatch: { input: "$title", regex: /^DRDO/i } }, then: "DRDO" },
                { case: { $regexMatch: { input: "$title", regex: /^ISRO/i } }, then: "ISRO" },
                { case: { $regexMatch: { input: "$title", regex: /^DSSSB/i } }, then: "DSSSB (Delhi)" },
                { case: { $regexMatch: { input: "$title", regex: /^HSSC|^Haryana HSSC/i } }, then: "HSSC (Haryana)" },
                { case: { $regexMatch: { input: "$title", regex: /^Haryana/i } }, then: "Haryana (Other)" },
                { case: { $regexMatch: { input: "$title", regex: /^CGPSC/i } }, then: "CGPSC (CG)" },
                { case: { $regexMatch: { input: "$title", regex: /^UKSSSC|^UKPSC/i } }, then: "UKSSSC/UKPSC (Uttarakhand)" },
                { case: { $regexMatch: { input: "$title", regex: /^IIT|^NIT/i } }, then: "IIT/NIT" },
                { case: { $regexMatch: { input: "$title", regex: /^IOCL/i } }, then: "IOCL" },
                { case: { $regexMatch: { input: "$title", regex: /^NTPC/i } }, then: "NTPC" },
                { case: { $regexMatch: { input: "$title", regex: /^CBSE/i } }, then: "CBSE" },
                { case: { $regexMatch: { input: "$title", regex: /^NVS/i } }, then: "NVS" },
                { case: { $regexMatch: { input: "$title", regex: /^KVS/i } }, then: "KVS" },
                { case: { $regexMatch: { input: "$title", regex: /^IB\b/i } }, then: "IB (Intelligence Bureau)" },
                { case: { $regexMatch: { input: "$title", regex: /^AIIMS/i } }, then: "AIIMS" },
                { case: { $regexMatch: { input: "$title", regex: /^India Post|^IPPB/i } }, then: "India Post" },
                { case: { $regexMatch: { input: "$title", regex: /^LIC|^NIACL|^NICL|^OICL|^ECGC|^UIIC/i } }, then: "Insurance (LIC/NIACL)" },
                { case: { $regexMatch: { input: "$title", regex: /^SEBI|^SIDBI/i } }, then: "Financial Regulator" },
                { case: { $regexMatch: { input: "$title", regex: /^Patna High Court|^Allahabad High Court|^Delhi High Court|^Bombay High Court|^Jharkhand High Court|^Haryana High Court|^Telangana High Court|^MP High Court|^Supreme Court/i } }, then: "High Court / Supreme Court" },
                { case: { $regexMatch: { input: "$title", regex: /^UPPSC|^UP TGT|^UP RTE|^UP Poly|^UPTET|^UPSRTC|^UPHESC|^UPBEd|^UP Co-operative|^UP Pollution|^UP Anganwadi|^UP Home/i } }, then: "UP (Other)" },
              ],
              default: "Other",
            },
          },
        },
      },
      {
        $group: {
          _id: "$_org",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          organization: "$_id",
          count: 1,
        },
      },
    ]);

    const totalCount = byOrganization.reduce((acc, item) => acc + item.count, 0);

    res.status(200).json({
      total: totalCount,
      byOrganization,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { getSchemesCount, getBlogsCount, getPostsCount, getPostsAdvancedStats };
