function SkeletonBar({ className = "" }) {
  return <div className={`skeleton-shimmer rounded-md ${className}`.trim()} aria-hidden="true" />;
}

function SkeletonSectionTitle({ badgeWidth = "w-8", titleWidth = "w-36", pillWidth = "" }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <SkeletonBar className={`h-8 ${badgeWidth} rounded-md`} />
      <SkeletonBar className={`h-5 ${titleWidth}`} />
      {pillWidth ? <SkeletonBar className={`h-6 ${pillWidth} rounded-full`} /> : null}
    </div>
  );
}

export function TrendingCardSkeleton() {
  return (
    <section>
      <SkeletonSectionTitle titleWidth="w-32" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`trending-skeleton-${index}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
              <SkeletonBar className="h-5 w-16 rounded" />
              <SkeletonBar className="h-5 w-5 rounded-full" />
            </div>
            <SkeletonBar className="mb-2 h-4 w-5/6" />
            <SkeletonBar className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ReminderCardSkeleton() {
  return (
    <section>
      <SkeletonSectionTitle titleWidth="w-36" pillWidth="w-24" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`deadline-skeleton-${index}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="min-w-0 flex-1">
              <SkeletonBar className="mb-2 h-4 w-3/4" />
              <SkeletonBar className="h-3 w-2/3" />
            </div>
            <SkeletonBar className="ml-3 h-8 w-14 rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ToolsCardSkeleton() {
  return (
    <section>
      <SkeletonSectionTitle titleWidth="w-32" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={`tools-skeleton-${index}`} className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <SkeletonBar className="mx-auto mb-3 h-10 w-10 rounded-full" />
            <SkeletonBar className="mx-auto h-4 w-3/4" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function SectionGridSkeleton({ cards = 6, itemsPerCard = 8 }) {
  return (
    <section className="py-10">
      <div className="section-grid-list grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: cards }).map((_, cardIndex) => (
          <div key={`section-grid-skeleton-${cardIndex}`} className="section-grid-card flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <SkeletonBar className="h-6 w-6 rounded-md" />
                <SkeletonBar className="h-4 w-28" />
              </div>
              <div className="flex items-center gap-2">
                <SkeletonBar className="h-6 w-16 rounded-full" />
                <SkeletonBar className="h-6 w-6 rounded-md" />
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {Array.from({ length: itemsPerCard }).map((_, itemIndex) => (
                <div key={`section-grid-row-${cardIndex}-${itemIndex}`} className="flex items-start justify-between gap-3 px-4 py-3">
                  <SkeletonBar className="h-4 w-3/4" />
                  <SkeletonBar className="h-4 w-14 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <TrendingCardSkeleton />
        <ReminderCardSkeleton />
        <ToolsCardSkeleton />
        <SectionGridSkeleton />
      </main>
    </div>
  );
}
