import PostPageShell from "../component/layout/PostPageShell";
import StaticInfoPage from "../component/legal/StaticInfoPage";
import { buildPageMetadata } from "../lib/seo";

const EFFECTIVE_DATE = "February 28, 2026";

export const metadata = buildPageMetadata({
  title: "Terms and Conditions",
  description:
    "Sarkari Afsar Terms and Conditions: website use rules, liability limits aur legal terms.",
  path: "/terms-and-conditions",
  keywords: ["terms and conditions", "website terms", "legal terms"],
});

const sections = [
  {
    title: "1. Acceptance of Terms",
    paragraphs: [
      "Sarkari Afsar website use karne par aap in terms se agree karte hain. Agar aap terms se agree nahi karte, to website use na karein.",
    ],
  },
  {
    title: "2. Nature of Service",
    paragraphs: [
      "Yeh platform informational purpose ke liye hai. Official application, verification aur final decision ke liye hamesha official department/board notification follow karein.",
    ],
  },
  {
    title: "3. User Responsibilities",
    bullets: [
      "Site content ka misuse, scraping abuse ya unlawful use na karein.",
      "Important dates, fees aur eligibility ko official source se cross-check karein.",
      "False report/spam submissions se bachen.",
    ],
  },
  {
    title: "4. Intellectual Property",
    paragraphs: [
      "Website ka design, branding aur original compiled content protected ho sakta hai. Unauthorized commercial reuse bina permission ke allowed nahi hai.",
    ],
  },
  {
    title: "5. Limitation of Liability",
    paragraphs: [
      "Hum reasonable effort se accurate updates provide karte hain, lekin kisi bhi delay, typographical error ya third-party source change ke liye direct liability accept nahi ki ja sakti.",
    ],
  },
  {
    title: "6. Changes to Terms",
    paragraphs: [
      "Terms ko time to time update kiya ja sakta hai. Updated version website par publish hone ke baad effective mana jayega.",
    ],
  },
  {
    title: "7. Governing Law",
    paragraphs: [
      "Yeh terms India ke applicable laws ke under governed honge.",
    ],
  },
];

export default function TermsAndConditionsPage() {
  return (
    <PostPageShell>
      <StaticInfoPage
        eyebrow="Legal"
        title="Terms and Conditions"
        intro="Website use se pehle in terms ko dhyan se padh lena recommended hai."
        effectiveDate={EFFECTIVE_DATE}
        sections={sections}
      />
    </PostPageShell>
  );
}
