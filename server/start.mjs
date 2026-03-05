import { resolve } from "node:path";

try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(resolve(process.cwd(), ".env"));
  }
} catch (error) {
  console.warn(`[env] Unable to load .env: ${error?.message || error}`);
}

await import("./index.mjs");
