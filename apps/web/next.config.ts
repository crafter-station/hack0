import type { NextConfig } from "next";

const config: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "images.lumacdn.com" }] },
};

export default config;
