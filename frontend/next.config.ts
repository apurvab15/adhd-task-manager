import type { NextConfig } from "next";

const repoName = "adhd-task-manager";

const nextConfig: NextConfig = {
  output: "export",
  //comment out basepath and assetprefix for local builds
  basePath: `/${repoName}`,
  assetPrefix: `/${repoName}/`,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
