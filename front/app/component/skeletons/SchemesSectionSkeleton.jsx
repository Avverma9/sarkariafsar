import SkeletonBlock from "./SkeletonBlock";

function SchemeCardSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between">
        <SkeletonBlock className="h-16 w-16 rounded-2xl" />
        <SkeletonBlock className="h-6 w-20 rounded-lg" />
      </div>

      <SkeletonBlock className="h-3 w-24 rounded-md" />
      <SkeletonBlock className="mt-3 h-7 w-full rounded-md" />
      <SkeletonBlock className="mt-2 h-4 w-full rounded-md" />
      <SkeletonBlock className="mt-2 h-4 w-11/12 rounded-md" />

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <SkeletonBlock className="h-4 w-28 rounded-md" />
        <SkeletonBlock className="h-10 w-10 rounded-full" />
      </div>
    </div>
  );
}

export default function SchemesSectionSkeleton() {
  return (
    <div id="schemes-section">
      <div className="mb-8 flex items-center justify-between px-2">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-8 w-8 rounded-lg" />
            <SkeletonBlock className="h-8 w-56 rounded-lg" />
          </div>
          <SkeletonBlock className="mt-2 h-5 w-72 rounded-lg" />
        </div>

        <SkeletonBlock className="hidden h-10 w-32 rounded-full md:block" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SchemeCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
