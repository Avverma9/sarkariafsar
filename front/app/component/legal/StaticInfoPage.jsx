import Link from "next/link";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function StaticInfoPage({
  eyebrow = "Information",
  title = "",
  intro = "",
  effectiveDate = "",
  sections = [],
  contactEmail = "help@sarkariafsar.com",
}) {
  const normalizedSections = asArray(sections);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 bg-slate-50 px-6 py-6 sm:px-10 sm:py-8">
          <p className="text-xs font-bold tracking-[0.2em] text-indigo-600 uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl leading-tight font-black tracking-tight text-slate-900 sm:text-4xl">
            {title}
          </h1>
          {intro ? (
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
              {intro}
            </p>
          ) : null}
          {effectiveDate ? (
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Effective date: {effectiveDate}
            </p>
          ) : null}
        </header>

        <div className="space-y-8 px-6 py-8 sm:px-10 sm:py-10">
          {normalizedSections.map((section, index) => {
            const paragraphs = asArray(section?.paragraphs);
            const bullets = asArray(section?.bullets);

            return (
              <section
                key={`${section?.title || "section"}-${index + 1}`}
                className={index > 0 ? "border-t border-slate-100 pt-8" : ""}
              >
                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  {section?.title}
                </h2>

                {paragraphs.map((paragraph, paragraphIndex) => (
                  <p
                    key={`paragraph-${paragraphIndex + 1}`}
                    className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base"
                  >
                    {paragraph}
                  </p>
                ))}

                {bullets.length > 0 ? (
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700 sm:text-base">
                    {bullets.map((bullet, bulletIndex) => (
                      <li key={`bullet-${bulletIndex + 1}`}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </div>

        <footer className="border-t border-slate-200 bg-slate-50 px-6 py-6 sm:px-10">
          <p className="text-sm leading-relaxed text-slate-600">
            Kisi bhi query, correction request ya data-removal request ke liye{" "}
            <a className="font-semibold text-indigo-700 hover:text-indigo-800" href={`mailto:${contactEmail}`}>
              {contactEmail}
            </a>{" "}
            par contact karein.
          </p>

          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
            <Link
              className="rounded-full border border-slate-300 px-4 py-1.5 text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-700"
              href="/about"
            >
              About
            </Link>
            <Link
              className="rounded-full border border-slate-300 px-4 py-1.5 text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-700"
              href="/privacy-policy"
            >
              Privacy
            </Link>
            <Link
              className="rounded-full border border-slate-300 px-4 py-1.5 text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-700"
              href="/terms-and-conditions"
            >
              Terms
            </Link>
            <Link
              className="rounded-full border border-slate-300 px-4 py-1.5 text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-700"
              href="/disclaimer"
            >
              Disclaimer
            </Link>
            <Link
              className="rounded-full border border-slate-300 px-4 py-1.5 text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-700"
              href="/contact-us"
            >
              Contact
            </Link>
          </div>
        </footer>
      </article>
    </div>
  );
}
