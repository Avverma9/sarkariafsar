const toCleanText = (value = "") => String(value || "").replace(/\s+/g, " ").trim();

const STATUS_KEYWORDS =
  "(?:last\\s*date|apply\\s*last\\s*date|online\\s*apply\\s*last\\s*date|registration\\s*last\\s*date|form\\s*complete\\s*last\\s*date|start(?:ed)?|apply\\s*start|online\\s*apply\\s*start|end(?:ed)?|apply\\s*end|today|closing(?:\\s*date)?|ending|extended?|date\\s*extend(?:ed)?|out|soon|released?|available|live|notification(?:\\s*out)?|re-?open(?:ed)?)";

const TRAILING_STATUS_PATTERNS = [
  new RegExp(`\\s*[-|:]\\s*[^-:|()]*\\b${STATUS_KEYWORDS}\\b[^-:|()]*$`, "i"),
  new RegExp(`\\s*\\([^()]*\\b${STATUS_KEYWORDS}\\b[^()]*\\)\\s*$`, "i"),
];

const trimTrailingSeparators = (value = "") =>
  String(value || "")
    .replace(/[|:,-\s]+$/g, "")
    .trim();

export const cleanJobPostTitle = (value = "") => {
  let output = toCleanText(value).replace(/[–—]/g, "-");
  if (!output) return "";

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const current = output;

    for (const pattern of TRAILING_STATUS_PATTERNS) {
      output = trimTrailingSeparators(output.replace(pattern, ""));
    }

    if (output === current) break;
  }

  return output || toCleanText(value);
};

export default {
  cleanJobPostTitle,
};
