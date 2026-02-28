import PostPageShell from "../component/layout/PostPageShell";
import StaticInfoPage from "../component/legal/StaticInfoPage";
import { buildPageMetadata } from "../lib/seo";

const EFFECTIVE_DATE = "February 28, 2026";

export const metadata = buildPageMetadata({
  title: "Disclaimer",
  description:
    "Sarkari Afsar Disclaimer: official source verification, information usage aur liability clarification.",
  path: "/disclaimer",
  keywords: ["disclaimer", "official source verification", "legal disclaimer"],
});

const sections = [
  {
    title: "Informational Website",
    paragraphs: [
      "Sarkari Afsar koi government organization ya official recruitment board website nahi hai. Yeh ek independent informational portal hai.",
    ],
  },
  {
    title: "Verify from Official Sources",
    bullets: [
      "Application submit karne se pehle official notification padhein.",
      "Exam date, age limit, fee aur eligibility official website par verify karein.",
      "Admit card/result ke liye official portal ko primary source maan kar chalein.",
    ],
  },
  {
    title: "External Links",
    paragraphs: [
      "Website par diye gaye external links convenience ke liye hote hain. Third-party website ke content, availability ya policy par hamara direct control nahi hota.",
    ],
  },
  {
    title: "No Guaranteed Outcome",
    paragraphs: [
      "Information provide ki jati hai, lekin is basis par kisi recruitment, admission ya benefit claim ka guaranteed outcome nahi mana jayega.",
    ],
  },
];

export default function DisclaimerPage() {
  return (
    <PostPageShell>
      <StaticInfoPage
        eyebrow="Legal"
        title="Disclaimer"
        intro="Important legal clarification: final decision ke liye official notification hi valid maana jayega."
        effectiveDate={EFFECTIVE_DATE}
        sections={sections}
      />
    </PostPageShell>
  );
}
