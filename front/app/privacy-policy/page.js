import PostPageShell from "../component/layout/PostPageShell";
import StaticInfoPage from "../component/legal/StaticInfoPage";
import { buildPageMetadata } from "../lib/seo";

const EFFECTIVE_DATE = "February 28, 2026";

export const metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "Sarkari Afsar Privacy Policy: kaunsa data collect hota hai, kaise use hota hai aur user rights.",
  path: "/privacy-policy",
  keywords: ["privacy policy", "data policy", "user privacy"],
});

const sections = [
  {
    title: "1. Information We Collect",
    bullets: [
      "Basic technical data jaise browser type, device type, anonymous usage logs.",
      "Agar aap email karte hain to aapka name/email aur message content.",
      "Cookies ya similar technologies ke through preference related data.",
    ],
  },
  {
    title: "2. Data Ka Use",
    bullets: [
      "Website performance improve karne ke liye.",
      "Relevant pages aur better search experience dene ke liye.",
      "User support aur correction requests ka reply dene ke liye.",
    ],
  },
  {
    title: "3. Cookies",
    paragraphs: [
      "Cookies ka use basic analytics aur experience personalization ke liye ho sakta hai. Aap browser settings se cookies disable kar sakte hain.",
    ],
  },
  {
    title: "4. Third-Party Services",
    paragraphs: [
      "Site me external links ho sakte hain jo third-party websites par le jate hain. Un websites ki privacy practices unki apni policy ke according hoti hain.",
    ],
  },
  {
    title: "5. Data Security & Retention",
    paragraphs: [
      "Reasonable security measures follow kiye jate hain, lekin internet transmission 100% secure guarantee nahi karta.",
      "Data ko sirf utne duration tak rakha jata hai jitna operational ya legal purpose ke liye required ho.",
    ],
  },
  {
    title: "6. Your Rights",
    bullets: [
      "Aap apne contact data ke correction ya deletion ke liye request bhej sakte hain.",
      "Aap kisi bhi samay communications se opt-out kar sakte hain.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <PostPageShell>
      <StaticInfoPage
        eyebrow="Legal"
        title="Privacy Policy"
        intro="Yeh policy batati hai ki Sarkari Afsar par aapki privacy kaise handle ki jati hai."
        effectiveDate={EFFECTIVE_DATE}
        sections={sections}
      />
    </PostPageShell>
  );
}
