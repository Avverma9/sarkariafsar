import { AggregatorSite } from "../models/aggregator.model.mjs";
import logger from "../utils/logger.mjs";
import { scrapeSectionsFromSite } from "../services/section.service.mjs";

export const getSectionsFromActiveSites = async (req, res, next) => {
  try {
    const sites = await AggregatorSite.find({ status: "active" }).lean();

    if (!sites.length) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const results = await Promise.allSettled(
      sites.map(async (site) => {
        const sections = await scrapeSectionsFromSite(site.url);
        return {
          siteId: String(site._id),
          name: site.name,
          url: site.url,
          sections,
        };
      })
    );

    const data = [];
    for (const r of results) {
      if (r.status === "fulfilled") data.push(r.value);
      else logger.error(`Section scrape failed: ${r.reason?.message || r.reason}`);
    }

    // update lastChecked for active sites
    await AggregatorSite.updateMany(
      { status: "active" },
      { $set: { lastChecked: new Date() } }
    );

    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};
