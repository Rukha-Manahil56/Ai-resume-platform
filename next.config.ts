import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse bundles native/pdf.js code — keep it on the server as an external package
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
