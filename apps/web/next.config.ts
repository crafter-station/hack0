import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";
import { IMAGE_HOSTS } from "./lib/images";

const config: NextConfig = {
  images: { remotePatterns: IMAGE_HOSTS.map((hostname) => ({ protocol: "https", hostname })) },
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
      // Taste hacking moved to its own domain. Testimonials stay here: they use hack0's database and sign-in.
      { source: "/taste-hacking", destination: "https://tastehacking.dev", permanent: true },
      {
        source: "/taste-hacking/:path((?!testimonials(?:/|$)).*)",
        destination: "https://tastehacking.dev/:path",
        permanent: true,
      },
    ];
  },
};

export default withWorkflow(config);
