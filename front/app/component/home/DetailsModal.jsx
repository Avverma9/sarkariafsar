import {
  BookOpen,
  Calendar,
  CheckCircle,
  ExternalLink,
  FileText,
  Info,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

export default function DetailsModal({ selectedItem, onClose }) {
  if (!selectedItem) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-md transition-all duration-300 sm:items-center sm:p-6">
      <div className="animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-[2rem]">
        <div className="relative flex items-start justify-between border-b border-slate-100 bg-white px-6 py-6 text-slate-900 sm:px-10 sm:py-8">
          <div className="relative z-10 w-full pr-12">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold tracking-wider text-slate-600 uppercase">
                {selectedItem.state}
              </span>

              {selectedItem.type === "update" && (
                <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold tracking-wider text-indigo-600 uppercase">
                  {selectedItem.department}
                </span>
              )}
            </div>

            <h2 className="text-2xl leading-tight font-black tracking-tight sm:text-3xl lg:text-4xl">
              {selectedItem.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="custom-scrollbar flex-grow overflow-y-auto bg-slate-50/50 p-6 text-left sm:p-10">
          {selectedItem.type === "update" && (
            <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-widest text-slate-400 uppercase">
                  <Calendar className="h-4 w-4 text-indigo-500" /> Last Date
                </p>
                <p className="text-lg font-black text-rose-600">
                  {selectedItem.lastDate || "N/A"}
                </p>
              </div>

              <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-widest text-slate-400 uppercase">
                  <Users className="h-4 w-4 text-indigo-500" /> Vacancies
                </p>
                <p className="text-lg font-black text-slate-900">
                  {selectedItem.vacancies || "N/A"}
                </p>
              </div>

              <div className="col-span-2 flex flex-col justify-center rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-widest text-slate-400 uppercase">
                  <BookOpen className="h-4 w-4 text-indigo-500" /> Qualification
                </p>
                <p className="text-lg font-black text-slate-900">
                  {selectedItem.qualification || "N/A"}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-10">
            <section>
              <h4 className="mb-4 flex items-center gap-3 text-base font-black tracking-wider text-slate-900 uppercase">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Info className="h-5 w-5" />
                </div>
                {selectedItem.type === "update"
                  ? "Jankari / Details"
                  : "Yojana Ke Fayde"}
              </h4>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-base leading-relaxed font-medium text-slate-700 sm:text-lg">
                  {selectedItem.benefits}
                </p>
              </div>
            </section>

            <section>
              <h4 className="mb-4 flex items-center gap-3 text-base font-black tracking-wider text-slate-900 uppercase">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <CheckCircle className="h-5 w-5" />
                </div>
                Apply Karne Ka Tarika
              </h4>

              <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
                <ul className="divide-y divide-slate-100">
                  {selectedItem.process.map((step, index) => (
                    <li
                      key={step}
                      className="flex items-start gap-5 p-4 text-slate-700 sm:p-5"
                    >
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-500">
                        {index + 1}
                      </span>
                      <span className="pt-1 text-base font-medium">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section>
              <h4 className="mb-4 flex items-center gap-3 text-base font-black tracking-wider text-slate-900 uppercase">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <FileText className="h-5 w-5" />
                </div>
                Zaroori Kagzat (Documents)
              </h4>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {selectedItem.documents.map((doc) => (
                    <li
                      key={doc}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-base font-medium text-slate-700"
                    >
                      <ShieldCheck className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </div>

        <div className="flex flex-col justify-end gap-4 border-t border-slate-100 bg-white p-6 sm:flex-row">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-slate-100 px-8 py-4 text-center text-sm font-black tracking-wide text-slate-700 uppercase transition-colors hover:bg-slate-200 sm:w-auto"
          >
            Close
          </button>

          <button className="flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-black tracking-wide text-white uppercase shadow-lg transition-all hover:bg-indigo-700 hover:shadow-xl sm:w-auto">
            {selectedItem.type === "update"
              ? "Apply Now"
              : "Official Website Par Jayein"}
            <ExternalLink className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
