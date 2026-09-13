import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native / binary-backed packages must stay external to the server bundle.
  serverExternalPackages: ["@prisma/client", "prisma", "ffmpeg-static", "@google/genai", "playwright", "embedded-postgres"],
};

export default nextConfig;
