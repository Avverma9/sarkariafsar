export default function SkeletonBlock({ className = "", as: Component = "div" }) {
  return <Component aria-hidden className={`skeleton-shimmer ${className}`.trim()} />;
}
