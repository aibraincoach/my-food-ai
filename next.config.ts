import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Shared by the document and the worker import; changes on every build.
  env: { NEXT_PUBLIC_BUILD: `${process.env.VERCEL_GIT_COMMIT_SHA ?? "local"}-${Date.now()}` },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
