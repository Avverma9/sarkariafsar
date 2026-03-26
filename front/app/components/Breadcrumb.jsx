import Link from "next/link";

/**
 * items: Array<{ label: string, href?: string }>
 *   – last item should have no href (current page, aria-current="page")
 * theme: "dark" – white text (use inside dark/gradient hero sections)
 *        "light" – gray text (use on white/light backgrounds)
 */
export default function Breadcrumb({ items, theme = "dark" }) {
  const isDark = theme === "dark";

  const olStyle = {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "2px",
  };

  const liStyle = {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.02em",
  };

  const linkStyle = {
    color: isDark ? "rgba(255,255,255,0.55)" : "#6B7280",
    textDecoration: "none",
    transition: "color 0.18s",
  };

  const sepStyle = {
    color: isDark ? "rgba(255,255,255,0.28)" : "#D1D5DB",
    fontSize: "0.62rem",
  };

  const currentStyle = {
    color: isDark ? "rgba(255,255,255,0.9)" : "#111827",
    maxWidth: "260px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "inline-block",
  };

  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: "16px" }}>
      <ol style={olStyle}>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} style={liStyle}>
              {isLast ? (
                <span aria-current="page" style={currentStyle} title={item.label}>
                  {item.label}
                </span>
              ) : (
                <>
                  <Link href={item.href} style={linkStyle}>
                    {item.label}
                  </Link>
                  <span style={sepStyle}>/</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
