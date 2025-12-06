/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { hostname: "utfs.io" },
      { hostname: "*.ufs.sh" },
      { hostname: "d112y698adiu2z.cloudfront.net" },
      { hostname: "images.lumacdn.com" },
      { hostname: "cdn.lu.ma" },
    ],
  },
}

export default nextConfig
