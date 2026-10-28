import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";
import { IMAGE_HOSTS } from "./lib/images";

const config: NextConfig = {
  images: { remotePatterns: IMAGE_HOSTS.map((hostname) => ({ protocol: "https", hostname })) },
};

export default withWorkflow(config);
