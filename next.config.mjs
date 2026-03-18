/** @type {import('next').NextConfig} */
const nextConfig = {
	typescript: {
		ignoreBuildErrors: true,
	},
	serverExternalPackages: ["@takumi-rs/image-response"],
	images: {
		remotePatterns: [{ protocol: "https", hostname: "**" }],
		dangerouslyAllowSVG: true,
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
	},
};

export default nextConfig;
