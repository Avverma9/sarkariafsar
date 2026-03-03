import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/yojana/:slug*",
        destination: "/schemes/:slug*",
        permanent: true,
      },
      {
        source: "/terms-condition",
        destination: "/terms-and-conditions",
        permanent: true,
      },
      {
        source: "/jobs",
        destination: "/post",
        permanent: true,
      },
      {
        source: "/jobs/results",
        destination: "/results",
        permanent: true,
      },
      {
        source: "/jobs/admit-cards",
        destination: "/admit-cards",
        permanent: true,
      },
      {
        source: "/jobs/:path*",
        destination: "/post/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
