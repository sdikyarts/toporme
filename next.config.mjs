import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {import("next").NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.tailwind.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default function config(phase) {
  if (phase !== PHASE_DEVELOPMENT_SERVER) return nextConfig;

  return {
    ...nextConfig,
    reactCompiler: false,
    ...(process.env.TOPORME_WATCH_POLLING === "1" && {
      watchOptions: { pollIntervalMs: 1000 },
    }),
    experimental: {
      turbopackFileSystemCacheForDev: process.platform !== "win32",
    },
  };
}
