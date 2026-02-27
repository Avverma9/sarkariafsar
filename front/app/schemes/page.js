import PostPageShell from "../component/layout/PostPageShell";
import SchemesListingPage from "../component/scheme/SchemesListingPage";
import {
  loadSchemesListingPage,
  parseSchemesListingQuery,
} from "../lib/schemesListingPage";
import { buildPageMetadata } from "../lib/seo";

export const metadata = buildPageMetadata({
  title: "Government Schemes",
  description:
    "Central aur state level government schemes ka searchable listing page with state-wise filters.",
  path: "/schemes",
  keywords: ["government schemes", "yojana listing", "state schemes"],
});

export default async function SchemesPage({ searchParams }) {
  const query = parseSchemesListingQuery(await searchParams);
  const pageData = await loadSchemesListingPage(query);

  return (
    <PostPageShell>
      <SchemesListingPage {...pageData} />
    </PostPageShell>
  );
}
