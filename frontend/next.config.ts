import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Vercel deployment supports API routes natively, no static export needed
  images: { unoptimized: true },
};

export default nextConfig;
