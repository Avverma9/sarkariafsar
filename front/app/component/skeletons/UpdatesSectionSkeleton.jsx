import SkeletonBlock from "./SkeletonBlock";

function UpdatesCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_-22px_rgba(15,23,42,0.5)]">
      <div className="flex items-center gap-2 border-b border-slate-200 px-3.5 py-2.5">
        <SkeletonBlock className="h-7 w-7 rounded-lg bg-white" />
        <SkeletonBlock className="h-7 w-32 rounded-lg" />
      </div>

      <div className="h-[500px] space-y-2 bg-slate-50/70 p-2">
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border border-slate-100 bg-white px-2.5 py-1.5"
          >
            <div className="flex items-start gap-2">
              <SkeletonBlock className="mt-0.5 h-4 w-4 rounded-full" />
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-4 w-full rounded-md" />
                <SkeletonBlock className="mt-1.5 h-4 w-5/6 rounded-md" />
                <SkeletonBlock className="mt-1.5 h-3 w-20 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 bg-white px-3.5 py-2.5 text-center">
        <SkeletonBlock className="mx-auto h-4 w-20 rounded-md" />
      </div>
    </div>
  );
}

export default function UpdatesSectionSkeleton() {
  return (
    <div className="mb-14">
      <div className="mb-7 px-2">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-8 w-8 rounded-lg" />
          <SkeletonBlock className="h-8 w-60 rounded-lg" />
        </div>
        <SkeletonBlock className="mt-2 h-5 w-72 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <UpdatesCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
