import "dotenv/config";
import cluster from "node:cluster";
import os from "node:os";
import { fileURLToPath } from "node:url";
import app from "./src/app.mjs";
import { connectDB } from "./src/config/db.mjs";
import logger from "./src/utils/logger.mjs";
import { startPostUpdateScheduler } from "./src/services/postUpdate.service.mjs";

const PORT = process.env.PORT || 3000;
const CLUSTER_ENABLED = String(process.env.CLUSTER_ENABLED || "true")
  .trim()
  .toLowerCase() !== "false";
const WEB_CONCURRENCY = Math.max(
  1,
  Number(process.env.WEB_CONCURRENCY || os.cpus().length),
);

const startWorker = async () => {
  try {
    await connectDB();
    logger.info("MongoDB connected");
    if (String(process.env.RUN_SCHEDULERS || "true") === "true") {
      startPostUpdateScheduler();
      logger.info("Post update scheduler enabled on this worker");
    }

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}, pid=${process.pid}`);
    });
  } catch (error) {
    const details =
      error && typeof error === "object"
        ? error.stack || error.message
        : String(error);
    logger.error(`Failed to start server: ${details || "unknown error"}`);
    process.exit(1);
  }
};

if (CLUSTER_ENABLED && cluster.isPrimary) {
  cluster.setupPrimary({ exec: fileURLToPath(import.meta.url) });
  logger.info(`Cluster primary started. workers=${WEB_CONCURRENCY}`);
  let schedulerWorkerId = null;
  for (let i = 0; i < WEB_CONCURRENCY; i++) {
    const isSchedulerWorker = i === 0;
    const worker = cluster.fork({
      RUN_SCHEDULERS: isSchedulerWorker ? "true" : "false",
    });
    if (isSchedulerWorker) schedulerWorkerId = worker.id;
  }

  cluster.on("exit", (worker, code, signal) => {
    logger.error(
      `Worker exited pid=${worker.process.pid} code=${code} signal=${signal}. Restarting...`,
    );
    const shouldRunSchedulers = worker.id === schedulerWorkerId;
    const replacement = cluster.fork({
      RUN_SCHEDULERS: shouldRunSchedulers ? "true" : "false",
    });
    if (shouldRunSchedulers) {
      schedulerWorkerId = replacement.id;
    }
  });
} else {
  startWorker();
}
