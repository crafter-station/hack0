import { syncSource } from "@/workflows/sync-source";
await new Promise((r) => setTimeout(r, 90_000));
console.log(JSON.stringify(await syncSource(process.argv[2] as string)));
process.exit(0);
