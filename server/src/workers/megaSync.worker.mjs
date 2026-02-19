import { parentPort, workerData } from "node:worker_threads";
import { connectDB } from "../config/db.mjs";
import { syncMegaSectionsAndPosts } from "../services/scraper.service.mjs";

async function run() {
  try {
    await connectDB();
    const postDelayMs = Number(workerData?.postDelayMs || 0);
    const reason = String(workerData?.reason || "manual");
    const result = await syncMegaSectionsAndPosts({ postDelayMs, reason });
    parentPort?.postMessage({
      ok: true,
      reason,
      result,
    });
  } catch (err) {
    parentPort?.postMessage({
      ok: false,
      error: err?.message || "Worker failed",
    });
    process.exitCode = 1;
  }
}

run().catch((err) => {
  parentPort?.postMessage({
    ok: false,
    error: err?.message || "Worker crashed",
  });
  process.exitCode = 1;
});
