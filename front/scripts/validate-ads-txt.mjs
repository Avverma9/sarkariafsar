import fs from "node:fs";
import path from "node:path";

const ADS_TXT_PATH = path.join(process.cwd(), "public", "ads.txt");

function fail(message) {
  console.error(`ads.txt validation failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(ADS_TXT_PATH)) {
  fail("public/ads.txt is missing");
}

const content = fs.readFileSync(ADS_TXT_PATH, "utf8").trim();

if (!content) {
  fail("public/ads.txt is empty");
}

const lines = content
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"));

if (lines.length === 0) {
  fail("public/ads.txt has no valid records");
}

lines.forEach((line, index) => {
  const parts = line.split(",").map((part) => part.trim());

  if (parts.length < 3) {
    fail(`line ${index + 1} must have at least 3 comma-separated fields`);
  }

  const [domain, publisherId, relationship] = parts;

  if (!domain || !publisherId || !relationship) {
    fail(`line ${index + 1} has empty required fields`);
  }

  if (!/^(DIRECT|RESELLER)$/i.test(relationship)) {
    fail(`line ${index + 1} relationship must be DIRECT or RESELLER`);
  }
});

