import SkeletonBlock from "./SkeletonBlock";

function TableSkeleton() {
  return (
    <section className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_-24px_rgba(15,23,42,0.6)]">
      <header className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <SkeletonBlock className="h-7 w-7 rounded-lg bg-white" />
        <SkeletonBlock className="h-7 w-44 rounded-md" />
      </header>

      <div className="flex-grow space-y-1 bg-slate-50/70 p-2.5">
        {Array.from({ length: 20 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border border-slate-100 bg-white px-3 py-2"
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

      <footer className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-2.5">
        <SkeletonBlock className="h-4 w-28 rounded-md" />
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-8 w-20 rounded-full" />
          <SkeletonBlock className="h-8 w-16 rounded-full" />
        </div>
      </footer>
    </section>
  );
}

export default function JobsTablesPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
      <div className="mb-7 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-6 py-7 shadow-xl sm:px-8">
        <SkeletonBlock className="h-4 w-28 rounded-md bg-white/20" />
        <SkeletonBlock className="mt-3 h-10 w-60 rounded-md bg-white/20" />
        <SkeletonBlock className="mt-3 h-5 w-2/3 rounded-md bg-white/20" />
        <SkeletonBlock className="mt-2 h-5 w-1/2 rounded-md bg-white/20" />
        <SkeletonBlock className="mt-4 h-4 w-48 rounded-md bg-white/20" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <TableSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
