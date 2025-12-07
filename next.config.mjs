/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["@takumi-rs/image-response"],
  images: {
    remotePatterns: [
      { hostname: "utfs.io" },
      { hostname: "*.ufs.sh" },
      { hostname: "d112y698adiu2z.cloudfront.net" },
      { hostname: "images.lumacdn.com" },
      { hostname: "cdn.lu.ma" },
      { hostname: "og.luma.com" },
    ],
  },
}

export default nextConfig
