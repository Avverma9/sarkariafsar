export const dynamic = "force-dynamic";

export async function GET() {
  const rawClient = String(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "").trim();
  const publisherId = rawClient.replace(/^ca-/, "");

  const content = publisherId
    ? `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`
    : "";

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
