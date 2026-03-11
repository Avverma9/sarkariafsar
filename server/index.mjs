import "./utils/loadEnv.mjs";
import express from "express";
import cors from "cors";
import compression from "compression";
import router from "./routes/index.mjs";
import connectDatabase from "./db/config.mjs";
import { startGovSchemeScrapeCron } from "./cron/govscheme.cron.mjs";
import { startJobListSyncCron } from "./cron/joblist.cron.mjs";
import { startJobDetailSyncCron } from "./cron/jobdetail.cron.mjs";
import { startAppCacheClearCron } from "./cron/cache-clear.cron.mjs";

const app = express();

app.disable("x-powered-by");
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, req, res, next) => {
  const message = error?.message || "Something went wrong";
  const lowerCaseMessage = message.toLowerCase();
  const isClientError =
    lowerCaseMessage.includes("required") ||
    lowerCaseMessage.includes("invalid") ||
    lowerCaseMessage.includes("malformed");

  res.status(isClientError ? 400 : 500).json({
    success: false,
    message,
  });
});

const PORT = Number.parseInt(process.env.PORT || "5000", 10);

const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  startGovSchemeScrapeCron();
  startJobListSyncCron();
  startJobDetailSyncCron();
  startAppCacheClearCron();
};

startServer().catch((error) => {
  console.error("Failed to start server:", error?.message || error);
  process.exit(1);
});

export default app;
