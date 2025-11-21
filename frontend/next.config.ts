import type { NextConfig } from "next";

const repoName = "adhd-task-manager";

const nextConfig: NextConfig = {
  output: "export",
  basePath: `/${repoName}`,
  assetPrefix: `/${repoName}/`,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
