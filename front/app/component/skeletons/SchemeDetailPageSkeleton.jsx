import SkeletonBlock from "./SkeletonBlock";

export default function SchemeDetailPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-14 sm:px-6 lg:px-8">
      <div className="mb-5">
        <SkeletonBlock className="h-10 w-36 rounded-full" />
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-indigo-950 p-6 shadow-xl sm:p-8">
        <SkeletonBlock className="h-4 w-36 rounded-md" />
        <SkeletonBlock className="mt-3 h-11 w-3/4 rounded-md" />
        <SkeletonBlock className="mt-4 h-8 w-2/3 rounded-full" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SkeletonBlock className="h-24 rounded-2xl" />
        <SkeletonBlock className="h-24 rounded-2xl" />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <SkeletonBlock className="h-7 w-48 rounded-md" />
        <SkeletonBlock className="mt-4 h-5 w-full rounded-md" />
        <SkeletonBlock className="mt-2 h-5 w-11/12 rounded-md" />
        <SkeletonBlock className="mt-2 h-5 w-10/12 rounded-md" />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <SkeletonBlock className="h-7 w-56 rounded-md" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <SkeletonBlock className="h-7 w-48 rounded-md" />
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
