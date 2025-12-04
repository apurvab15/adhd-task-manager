import type { NextConfig } from "next";

const repoName = "adhd-task-manager";
const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  /* config options here */
  // Only use static export for production builds (not in dev mode)
  // This allows API routes to work in development
  ...(isProduction ? { 
    output: "export",
  } : {}),
  // Only use basePath and assetPrefix in production (for GitHub Pages deployment)
  // In development, these can interfere with API routes
  ...(isProduction ? {
    basePath: `/${repoName}`,
    assetPrefix: `/${repoName}/`,
  } : {}),
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
