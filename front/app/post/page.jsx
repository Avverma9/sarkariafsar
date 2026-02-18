import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Post Redirect Helper",
  description: "Helper page to route users to the correct post detail URL using canonical key.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LegacyPostPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const rawCanonical = resolvedSearchParams?.canonicalKey;
  const canonicalKey = String(Array.isArray(rawCanonical) ? rawCanonical[0] : rawCanonical || "").trim();

  if (canonicalKey) {
    redirect(`/post/${encodeURIComponent(canonicalKey)}`);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="text-sm font-semibold">Post URL is missing canonical key.</p>
        <p className="mt-1 text-sm">Use route format: /post/&lt;canonicalKey&gt;</p>
        <Link href="/" className="mt-4 inline-block text-sm font-semibold text-indigo-700 hover:underline">
          Go back to Home
        </Link>
      </div>
    </main>
  );
}
