import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";
import { IMAGE_HOSTS } from "./lib/images";

const config: NextConfig = {
  images: { remotePatterns: IMAGE_HOSTS.map((hostname) => ({ protocol: "https", hostname })) },
  // Badges read JetBrains Mono at request time to draw their text as paths.
  outputFileTracingIncludes: { "/badge/**": ["./app/taste-hacking/_og/fonts/*.ttf"] },
  // Public routes of the previous app that search engines still list. /c/* is a route handler.
  async redirects() {
    return [
      { source: "/events", destination: "/eventos", permanent: true },
      { source: "/e/:code*", destination: "/eventos", permanent: true },
      ...["/builders", "/opportunities", "/roadmap", "/data-health", "/profile"].map((source) => ({
        source,
        destination: "/",
        permanent: true,
      })),
      // Taste hacking moved to its own domain, testimonials and their review included.
      { source: "/taste-hacking", destination: "https://tastehacking.dev", permanent: true },
      { source: "/taste-hacking/:path*", destination: "https://tastehacking.dev/:path*", permanent: true },
      { source: "/admin/testimonios", destination: "https://tastehacking.dev/admin/testimonios", permanent: true },
    ];
  },
};

export default withWorkflow(config);
