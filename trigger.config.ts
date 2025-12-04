import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "proj_pebsxfniggisvfuccvce",
  runtime: "node",
  logLevel: "log",
  maxDuration: 120,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
    },
  },
  dirs: ["./trigger"],
});
