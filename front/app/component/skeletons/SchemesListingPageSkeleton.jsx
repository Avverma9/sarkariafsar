import SkeletonBlock from "./SkeletonBlock";

function SchemeCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex gap-2">
        <SkeletonBlock className="h-5 w-24 rounded-full" />
        <SkeletonBlock className="h-5 w-20 rounded-full" />
      </div>
      <SkeletonBlock className="mt-3 h-6 w-11/12 rounded-md" />
      <SkeletonBlock className="mt-3 h-4 w-full rounded-md" />
      <SkeletonBlock className="mt-2 h-4 w-10/12 rounded-md" />
      <SkeletonBlock className="mt-2 h-4 w-9/12 rounded-md" />
      <SkeletonBlock className="mt-4 h-9 w-24 rounded-full" />
    </div>
  );
}

export default function SchemesListingPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-indigo-950 p-6 shadow-xl sm:p-8">
        <SkeletonBlock className="h-4 w-28 rounded-md bg-white/20" />
        <SkeletonBlock className="mt-3 h-10 w-72 rounded-md bg-white/20" />
        <SkeletonBlock className="mt-3 h-5 w-3/4 rounded-md bg-white/20" />
        <SkeletonBlock className="mt-2 h-5 w-2/3 rounded-md bg-white/20" />
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <SkeletonBlock className="h-11 rounded-xl lg:col-span-5" />
          <SkeletonBlock className="h-11 rounded-xl lg:col-span-3" />
          <SkeletonBlock className="h-11 rounded-xl lg:col-span-2" />
          <SkeletonBlock className="h-11 rounded-xl lg:col-span-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <SchemeCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
