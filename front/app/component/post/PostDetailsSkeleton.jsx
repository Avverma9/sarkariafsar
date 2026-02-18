function SkeletonBar({ className = "" }) {
  return <div className={`skeleton-shimmer rounded-md ${className}`.trim()} aria-hidden="true" />;
}

function SkeletonCard({ children, className = "" }) {
  return (
    <div className={`mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`.trim()}>
      {children}
    </div>
  );
}

function SectionHeaderSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3">
      <SkeletonBar className="h-4 w-4 rounded-full" />
      <SkeletonBar className="h-4 w-32" />
    </div>
  );
}

function KeyValueRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3">
      <SkeletonBar className="h-3 w-32" />
      <SkeletonBar className="h-3 w-24" />
    </div>
  );
}

function LinkButtonSkeleton() {
  return <SkeletonBar className="h-11 w-full rounded-lg" />;
}

export default function PostDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <SkeletonBar className="h-3 w-12" />
          <SkeletonBar className="h-3 w-3 rounded-full" />
          <SkeletonBar className="h-3 w-20" />
          <SkeletonBar className="h-3 w-3 rounded-full" />
          <SkeletonBar className="h-3 w-40" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SkeletonCard className="border-t-4 border-indigo-200 p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <SkeletonBar className="h-7 w-32 rounded-full" />
                <SkeletonBar className="h-4 w-28" />
              </div>
              <SkeletonBar className="mb-3 h-9 w-11/12" />
              <SkeletonBar className="mb-5 h-5 w-2/3" />

              <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
                <SkeletonBar className="mb-3 h-4 w-32" />
                <SkeletonBar className="mb-2 h-3 w-full" />
                <SkeletonBar className="mb-2 h-3 w-full" />
                <SkeletonBar className="h-3 w-5/6" />
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <SkeletonBar className="h-6 w-24 rounded" />
                <SkeletonBar className="h-6 w-20 rounded" />
                <SkeletonBar className="h-6 w-28 rounded" />
                <SkeletonBar className="h-6 w-24 rounded" />
              </div>

              <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                  <SkeletonBar className="mb-2 h-3 w-24" />
                  <SkeletonBar className="h-4 w-3/4" />
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                  <SkeletonBar className="mb-2 h-3 w-28" />
                  <SkeletonBar className="h-4 w-2/3" />
                </div>
              </div>
            </SkeletonCard>

            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <SkeletonCard className="mb-0 h-full">
                <SectionHeaderSkeleton />
                <div className="space-y-3 p-4">
                  {Array.from({ length: 7 }).map((_, index) => (
                    <KeyValueRowSkeleton key={`date-row-${index}`} />
                  ))}
                </div>
              </SkeletonCard>

              <SkeletonCard className="mb-0 h-full">
                <SectionHeaderSkeleton />
                <div className="space-y-3 p-4">
                  {Array.from({ length: 7 }).map((_, index) => (
                    <KeyValueRowSkeleton key={`fee-row-${index}`} />
                  ))}
                </div>
              </SkeletonCard>
            </div>

            <SkeletonCard>
              <SectionHeaderSkeleton />
              <div className="space-y-6 p-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={`metric-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <SkeletonBar className="mb-2 h-3 w-16" />
                      <SkeletonBar className="h-6 w-12" />
                    </div>
                  ))}
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="grid grid-cols-3 gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <SkeletonBar className="h-3 w-16" />
                    <SkeletonBar className="h-3 w-16" />
                    <SkeletonBar className="h-3 w-16" />
                  </div>
                  <div className="space-y-3 p-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={`vacancy-row-${index}`} className="grid grid-cols-3 gap-2">
                        <SkeletonBar className="h-3 w-20" />
                        <SkeletonBar className="h-3 w-16" />
                        <SkeletonBar className="h-3 w-16" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SkeletonCard>

            <SkeletonCard>
              <SectionHeaderSkeleton />
              <div className="space-y-6 p-6">
                <div>
                  <SkeletonBar className="mb-3 h-4 w-32" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded border border-slate-100 bg-slate-50 p-3">
                      <SkeletonBar className="mb-2 h-3 w-16" />
                      <SkeletonBar className="h-5 w-20" />
                    </div>
                    <div className="rounded border border-slate-100 bg-slate-50 p-3">
                      <SkeletonBar className="mb-2 h-3 w-16" />
                      <SkeletonBar className="h-5 w-20" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <SkeletonBar className="h-4 w-28" />
                  {Array.from({ length: 4 }).map((_, index) => (
                    <KeyValueRowSkeleton key={`elig-row-${index}`} />
                  ))}
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="grid grid-cols-4 gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <SkeletonBar className="h-3 w-12" />
                    <SkeletonBar className="h-3 w-12" />
                    <SkeletonBar className="h-3 w-12" />
                    <SkeletonBar className="h-3 w-12" />
                  </div>
                  <div className="space-y-3 p-4">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <div key={`physical-row-${index}`} className="grid grid-cols-4 gap-2">
                        <SkeletonBar className="h-3 w-16" />
                        <SkeletonBar className="h-3 w-16" />
                        <SkeletonBar className="h-3 w-16" />
                        <SkeletonBar className="h-3 w-16" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SkeletonCard>

            <SkeletonCard>
              <SectionHeaderSkeleton />
              <div className="grid grid-cols-1 gap-3 p-6 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`selection-step-${index}`} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <SkeletonBar className="h-7 w-7 rounded-full" />
                    <SkeletonBar className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            </SkeletonCard>

            <SkeletonCard>
              <SectionHeaderSkeleton />
              <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <SkeletonBar className="mb-3 h-4 w-32" />
                  <SkeletonBar className="mb-2 h-3 w-full" />
                  <SkeletonBar className="mb-2 h-3 w-full" />
                  <SkeletonBar className="h-3 w-5/6" />
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <SkeletonBar className="mb-3 h-4 w-28" />
                  <SkeletonBar className="mb-2 h-3 w-full" />
                  <SkeletonBar className="mb-2 h-3 w-full" />
                  <SkeletonBar className="h-3 w-2/3" />
                </div>
              </div>
            </SkeletonCard>

            <SkeletonCard>
              <SectionHeaderSkeleton />
              <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <SkeletonBar className="mb-3 h-4 w-36" />
                  <SkeletonBar className="mb-2 h-3 w-full" />
                  <SkeletonBar className="mb-2 h-3 w-full" />
                  <SkeletonBar className="h-3 w-5/6" />
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <SkeletonBar className="mb-3 h-4 w-24" />
                  <SkeletonBar className="mb-2 h-3 w-full" />
                  <SkeletonBar className="mb-2 h-3 w-full" />
                  <SkeletonBar className="h-3 w-4/5" />
                </div>
              </div>
            </SkeletonCard>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <SkeletonCard className="border-t-4 border-emerald-200 shadow-lg">
                <div className="flex items-center gap-3 border-b border-slate-200 bg-emerald-50 px-5 py-3">
                  <SkeletonBar className="h-4 w-4 rounded-full" />
                  <SkeletonBar className="h-4 w-28" />
                </div>
                <div className="space-y-3 p-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <LinkButtonSkeleton key={`link-btn-${index}`} />
                  ))}
                </div>
              </SkeletonCard>

              <SkeletonCard>
                <SectionHeaderSkeleton />
                <div className="space-y-4 p-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={`faq-row-${index}`} className="space-y-2 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                      <SkeletonBar className="h-3 w-4/5" />
                      <SkeletonBar className="h-3 w-full" />
                      <SkeletonBar className="h-3 w-3/4" />
                    </div>
                  ))}
                </div>
              </SkeletonCard>

              <div className="rounded-xl bg-gradient-to-br from-indigo-200 to-blue-200 p-6">
                <SkeletonBar className="mx-auto mb-3 h-8 w-8 rounded-full" />
                <SkeletonBar className="mx-auto mb-2 h-4 w-40" />
                <SkeletonBar className="mx-auto mb-4 h-3 w-44" />
                <SkeletonBar className="h-10 w-full rounded-lg bg-white/70" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
