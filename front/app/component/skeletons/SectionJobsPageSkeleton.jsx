import SkeletonBlock from "./SkeletonBlock";

function ListItemSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex md:items-center md:justify-between">
      <div className="min-w-0">
        <SkeletonBlock className="h-5 w-full max-w-[560px] rounded-md" />
        <SkeletonBlock className="mt-2 h-4 w-44 rounded-md" />
      </div>
      <div className="mt-3 flex gap-2 md:mt-0">
        <SkeletonBlock className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
}

export default function SectionJobsPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 shadow-xl sm:p-8">
        <SkeletonBlock className="h-4 w-28 rounded-md bg-white/20" />
        <SkeletonBlock className="mt-3 h-10 w-72 rounded-md bg-white/20" />
        <SkeletonBlock className="mt-3 h-5 w-3/4 rounded-md bg-white/20" />
        <SkeletonBlock className="mt-2 h-5 w-2/3 rounded-md bg-white/20" />
        <SkeletonBlock className="mt-4 h-4 w-44 rounded-md bg-white/20" />
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <SkeletonBlock className="h-11 rounded-xl lg:col-span-6" />
          <SkeletonBlock className="h-11 rounded-xl lg:col-span-3" />
          <SkeletonBlock className="h-11 rounded-xl lg:col-span-3" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <SkeletonBlock className="h-4 w-36 rounded-md" />
          <SkeletonBlock className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, index) => (
          <ListItemSkeleton key={index} />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        <SkeletonBlock className="h-8 w-14 rounded-lg" />
        <SkeletonBlock className="h-8 w-8 rounded-lg" />
        <SkeletonBlock className="h-8 w-8 rounded-lg" />
        <SkeletonBlock className="h-8 w-14 rounded-lg" />
      </div>
    </div>
  );
}
