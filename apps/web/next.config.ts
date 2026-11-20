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
    ];
  },
};

export default withWorkflow(config);
