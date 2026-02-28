import PostPageShell from "../component/layout/PostPageShell";
import StaticInfoPage from "../component/legal/StaticInfoPage";
import { buildPageMetadata } from "../lib/seo";

const EFFECTIVE_DATE = "February 28, 2026";

export const metadata = buildPageMetadata({
  title: "About Sarkari Afsar",
  description:
    "Sarkari Afsar ke baare me jaankari: hamara mission, content process aur user support details.",
  path: "/about",
  keywords: ["about sarkari afsar", "sarkari updates portal", "editorial process"],
});

const sections = [
  {
    title: "Hamare Bare Mein",
    paragraphs: [
      "Sarkari Afsar ek information platform hai jahan hum Sarkari Jobs, Results, Admit Cards aur Government Schemes ki updates simple language me publish karte hain.",
      "Hamari priority hai ki users ko ek jagah structured aur easy-to-read format me latest notices mil sakein.",
    ],
  },
  {
    title: "Hamara Mission",
    bullets: [
      "Important government notifications ko fast aur clear format me dena.",
      "State-wise aur category-wise content ko searchable banana.",
      "Users ko official source link tak pahunchane me help karna.",
    ],
  },
  {
    title: "Content Process",
    paragraphs: [
      "Hum alag-alag public sources aur official portals se available updates compile karte hain, fir unhe readable format me present karte hain.",
      "Har post ke saath users ko official notification ya official website verify karne ki salah di jati hai.",
    ],
  },
  {
    title: "Correction Policy",
    paragraphs: [
      "Agar kisi page me date, eligibility, fee ya link se related issue dikhe, humein email karein. Verified request par hum earliest possible correction karte hain.",
    ],
  },
];

export default function AboutPage() {
  return (
    <PostPageShell>
      <StaticInfoPage
        eyebrow="About"
        title="About Sarkari Afsar"
        intro="Trusted, fast aur easy-to-understand Sarkari update platform banane ka hamara seedha goal hai."
        effectiveDate={EFFECTIVE_DATE}
        sections={sections}
      />
    </PostPageShell>
  );
}
