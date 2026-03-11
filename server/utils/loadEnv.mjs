import { resolve } from "node:path";

const ENV_LOAD_FLAG = "__SARKARIAFSAR_ENV_LOADED__";

if (!globalThis[ENV_LOAD_FLAG]) {
  try {
    if (typeof process.loadEnvFile === "function") {
      process.loadEnvFile(resolve(process.cwd(), ".env"));
    }
  } catch (error) {
    console.warn(`[env] Unable to load .env: ${error?.message || error}`);
  }

  globalThis[ENV_LOAD_FLAG] = true;
}
