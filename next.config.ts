import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: false,
  output: "export",
  basePath: "/flexlab-site",
  images: { unoptimized: true },
};

export default nextConfig;
