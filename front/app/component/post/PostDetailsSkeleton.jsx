function SkeletonBar({ className = "" }) {
  return <div className={`skeleton-shimmer rounded-md ${className}`.trim()} aria-hidden="true" />;
}

export default function PostDetailsSkeleton() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#edf4ff] text-slate-800">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,_rgba(110,179,255,0.22),transparent_64%)]" />
      <div className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-[#8ec9ff]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-14 h-64 w-64 rounded-full bg-[#ffd097]/30 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1240px] px-3 pt-4 sm:px-4 lg:px-6">
        <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1.5 shadow-sm">
          <SkeletonBar className="h-3 w-10" />
          <SkeletonBar className="h-3 w-3 rounded-full" />
          <SkeletonBar className="h-3 w-20" />
          <SkeletonBar className="h-3 w-3 rounded-full" />
          <SkeletonBar className="h-3 w-44" />
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[1240px] px-3 pb-14 pt-2 sm:px-4 lg:px-6">
        <section className="mb-4 overflow-hidden rounded-[24px] border border-white/40 bg-gradient-to-r from-[#0b2c4c] via-[#0f66d0] to-[#0ca37d] p-5 shadow-[0_30px_45px_-35px_rgba(9,41,78,0.9)] sm:p-6">
          <SkeletonBar className="h-6 w-44 bg-white/45" />
          <SkeletonBar className="mt-4 h-9 w-[86%] bg-white/50" />
          <SkeletonBar className="mt-3 h-9 w-[72%] bg-white/45" />

          <div className="mt-4 flex flex-wrap gap-2">
            <SkeletonBar className="h-6 w-36 rounded-full bg-white/45" />
            <SkeletonBar className="h-6 w-44 rounded-full bg-white/45" />
            <SkeletonBar className="h-6 w-40 rounded-full bg-white/45" />
          </div>
        </section>

        <section className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_24px_36px_-30px_rgba(10,34,66,0.65)] sm:p-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonBar
                key={`intro-line-${index}`}
                className={`h-4 ${index === 4 ? "w-[72%]" : "w-full"}`}
              />
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-2 gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <SkeletonBar className="h-4 w-32" />
              <SkeletonBar className="h-4 w-32" />
            </div>
            <div className="space-y-3 p-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={`table-row-${index}`} className="grid grid-cols-2 gap-3">
                  <SkeletonBar className="h-3.5 w-full" />
                  <SkeletonBar className="h-3.5 w-[88%]" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {Array.from({ length: 10 }).map((_, index) => (
              <SkeletonBar
                key={`body-line-${index}`}
                className={`h-4 ${index % 3 === 0 ? "w-[84%]" : index % 3 === 1 ? "w-full" : "w-[76%]"}`}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
