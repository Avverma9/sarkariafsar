import SkeletonBlock from "./SkeletonBlock";

export default function FullContentPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
      <div className="mb-4">
        <SkeletonBlock className="h-10 w-40 rounded-full" />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <SkeletonBlock className="h-10 w-3/4 rounded-md" />
        <SkeletonBlock className="mt-4 h-5 w-full rounded-md" />
        <SkeletonBlock className="mt-2 h-5 w-11/12 rounded-md" />
        <SkeletonBlock className="mt-2 h-5 w-10/12 rounded-md" />

        <div className="mt-8 space-y-3">
          {Array.from({ length: 16 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-5 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
