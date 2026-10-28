import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const config: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "images.lumacdn.com" }] },
};

export default withWorkflow(config);
