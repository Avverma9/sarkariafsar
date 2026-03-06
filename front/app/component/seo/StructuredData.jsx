import { serializeJsonLd } from "../../lib/seo";

export default function StructuredData({ data }) {
  const items = (Array.isArray(data) ? data : [data]).filter(Boolean);

  if (items.length === 0) {
    return null;
  }

  return items.map((item, index) => (
    <script
      key={item?.["@id"] || `${item?.["@type"] || "jsonld"}-${index + 1}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(item) }}
    />
  ));
}
