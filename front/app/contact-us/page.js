import PostPageShell from "../component/layout/PostPageShell";
import StaticInfoPage from "../component/legal/StaticInfoPage";
import { buildPageMetadata } from "../lib/seo";

const EFFECTIVE_DATE = "February 28, 2026";
const SUPPORT_EMAIL = "help@sarkariafsar.com";

export const metadata = buildPageMetadata({
  title: "Contact Us",
  description:
    "Sarkari Afsar support se sampark karein: correction requests, partnership queries aur feedback.",
  path: "/contact-us",
  keywords: ["contact sarkari afsar", "support email", "report correction"],
});

const sections = [
  {
    title: "Support Email",
    paragraphs: [
      `General support, issue reporting aur feedback ke liye humein ${SUPPORT_EMAIL} par mail karein.`,
    ],
  },
  {
    title: "Kis Baat Ke Liye Contact Karein",
    bullets: [
      "Kisi post me galat date, link, eligibility ya fee detail ka correction.",
      "Technical issue jaise page open na hona ya search result mismatch.",
      "Partnership ya collaboration related business query.",
    ],
  },
  {
    title: "Response Time",
    paragraphs: [
      "Hum incoming mails ko priority ke saath review karte hain. High-impact correction requests ko as early as possible resolve karne ki koshish ki jati hai.",
    ],
  },
];

export default function ContactUsPage() {
  return (
    <PostPageShell>
      <StaticInfoPage
        eyebrow="Support"
        title="Contact Us"
        intro="Aapka feedback aur correction reports hamare liye valuable hain."
        effectiveDate={EFFECTIVE_DATE}
        sections={sections}
        contactEmail={SUPPORT_EMAIL}
      />
    </PostPageShell>
  );
}
