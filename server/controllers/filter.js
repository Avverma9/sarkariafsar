const JobPost = require("../models/post");
const Scheme = require("../models/schemes");

const getAllStates = async (req, res) => {
	try {
		const states = await JobPost.find().distinct("state");
		return res.status(200).json({ success: true, data: states });
	} catch (err) {
		console.error('getAllStates error:', err);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
};

/**
 * GET /api/post/filter
 *
 * Query params (all optional — at least one should be provided):
 *   state          — exact state name, e.g. "Bihar"
 *   dateFrom       — ISO date string, applyLastDate >= dateFrom
 *   dateTo         — ISO date string, applyLastDate <= dateTo
 *   eligibility    — keyword searched in eligibility[].qualification and eligibility[].post (case-insensitive)
 *   page           — page number (default 1)
 *   limit          — results per page (default 20, max 100)
 */
const filterPost = async (req, res) => {
    try {
        const { state, sectionName, dateFrom, dateTo, eligibility, page = 1, limit = 20 } = req.query;

        const query = { noIndex: { $ne: true } };

        // ── Section filter ──────────────────────────────────────────────────────
        if (sectionName) {
            query.sectionName = sectionName.trim();
        }

        // ── State filter ────────────────────────────────────────────────────────
        if (state) {
            query.state = state.trim();
        }

        // ── applyLastDate range filter ──────────────────────────────────────────
        if (dateFrom || dateTo) {
            query.applyLastDate = {};
            if (dateFrom) {
                const from = new Date(dateFrom);
                if (isNaN(from)) return res.status(400).json({ success: false, message: 'Invalid dateFrom format. Use ISO 8601, e.g. 2026-01-01' });
                query.applyLastDate.$gte = from;
            }
            if (dateTo) {
                const to = new Date(dateTo);
                if (isNaN(to)) return res.status(400).json({ success: false, message: 'Invalid dateTo format. Use ISO 8601, e.g. 2026-12-31' });
                query.applyLastDate.$lte = to;
            }
        }

        // ── Eligibility keyword filter ──────────────────────────────────────────
        // Searches both the post name and qualification text inside the
        // eligibility array (case-insensitive regex).
        if (eligibility) {
            const regex = new RegExp(eligibility.trim(), 'i');
            query.$or = [
                { 'eligibility.post': regex },
                { 'eligibility.qualification': regex },
            ];
        }

        const pageNum  = Math.max(1, parseInt(page, 10)  || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const [posts, total] = await Promise.all([
            JobPost.find(query)
                .sort({ applyLastDate: -1 })
                .skip(skip)
                .limit(limitNum)
                .select('-scrapedContent -humanContent -htmlSnapshot'), // strip heavy fields
            JobPost.countDocuments(query),
        ]);

        return res.status(200).json({
            success: true,
            total,
            page:  pageNum,
            pages: Math.ceil(total / limitNum),
            data:  posts,
        });
    } catch (err) {
        console.error('filterPost error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const filterScheme = async (req, res) => {
    try {
        const states = await Scheme.find().distinct("state");
        return res.status(200).json({ success: true, data: states });
    } catch (err) {
        console.error('filterScheme error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const filterSchemeByState = async (req, res) => {
    try {
        const { state } = req.query;
        if (!state) return res.status(400).json({ success: false, message: 'State query parameter is required' });
        const schemes = await Scheme.find({ state: state }).sort({ 'dates.regLastDate': -1 });
        return res.status(200).json({ success: true, data: schemes });
    } catch (err) {
        console.error('filterSchemeByState error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getAllStates, filterPost, filterScheme, filterSchemeByState  };
