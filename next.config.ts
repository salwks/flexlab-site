import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactCompiler: false,
  output: "export",
  basePath: isProd ? "/flexlab-site" : "",
  images: { unoptimized: true },
};

export default nextConfig;
