import SkeletonBlock from "./SkeletonBlock";

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <SkeletonBlock className="h-4 w-28 rounded-md" />
      <SkeletonBlock className="mt-4 h-5 w-32 rounded-md" />
      <SkeletonBlock className="mt-2 h-4 w-20 rounded-md" />
    </div>
  );
}

export default function PostDetailPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 shadow-xl sm:p-8">
        <SkeletonBlock className="h-6 w-40 rounded-full" />
        <SkeletonBlock className="mt-4 h-12 w-4/5 rounded-md" />
        <SkeletonBlock className="mt-2 h-12 w-3/5 rounded-md" />
        <SkeletonBlock className="mt-6 h-5 w-full rounded-md" />
        <SkeletonBlock className="mt-2 h-5 w-5/6 rounded-md" />
        <div className="mt-6 flex flex-wrap gap-3">
          <SkeletonBlock className="h-11 w-40 rounded-full" />
          <SkeletonBlock className="h-11 w-48 rounded-full" />
          <SkeletonBlock className="h-11 w-36 rounded-full" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <SkeletonBlock className="h-6 w-40 rounded-md" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-10 w-full rounded-md" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <SkeletonBlock className="h-6 w-32 rounded-md" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-8 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
