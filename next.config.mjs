/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {
    // Avoid persistent dev cache writes on slow Windows filesystems.
    turbopackFileSystemCacheForDev: process.platform !== "win32",
  },
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
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
