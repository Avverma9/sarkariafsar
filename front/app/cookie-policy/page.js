import PostPageShell from "../component/layout/PostPageShell";
import StaticInfoPage from "../component/legal/StaticInfoPage";
import { buildPageMetadata } from "../lib/seo";

const EFFECTIVE_DATE = "February 28, 2026";

export const metadata = buildPageMetadata({
  title: "Cookie Policy",
  description:
    "Sarkari Afsar Cookie Policy: cookies kya hoti hain, kaise use hoti hain aur unhe manage kaise karein.",
  path: "/cookie-policy",
  keywords: ["cookie policy", "browser cookies", "site preferences"],
});

const sections = [
  {
    title: "Cookies Kya Hoti Hain",
    paragraphs: [
      "Cookies chhote text files hote hain jo website visit ke dauran browser me store ho sakte hain. Inse basic preferences aur usage behavior samajhne me madad milti hai.",
    ],
  },
  {
    title: "Hum Cookies Kaise Use Karte Hain",
    bullets: [
      "Site performance aur pages ke usage pattern samajhne ke liye.",
      "Basic user preferences ya experience improve karne ke liye.",
      "Technical issues identify karke better stability dene ke liye.",
    ],
  },
  {
    title: "Aapka Control",
    paragraphs: [
      "Aap browser settings se cookies ko block ya delete kar sakte hain. Lekin kuch features iske baad expected tareeke se work na karein, yeh possible hai.",
    ],
  },
];

export default function CookiePolicyPage() {
  return (
    <PostPageShell>
      <StaticInfoPage
        eyebrow="Legal"
        title="Cookie Policy"
        intro="Yeh page explain karta hai ki cookies ka use kaise hota hai aur aapke paas kya controls hain."
        effectiveDate={EFFECTIVE_DATE}
        sections={sections}
      />
    </PostPageShell>
  );
}
