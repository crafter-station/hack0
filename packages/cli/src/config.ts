import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { atomicWriteJson } from "./cli/foundation/atomic-write.js";
import { ensureHome, getAppPaths } from "./cli/foundation/xdg-paths.js";
import type { InstallRecord } from "./contract.js";

const DEFAULT_API = "https://hack0.dev";

const paths = () => getAppPaths("hack0");

type Config = { key?: string; email?: string };

function readJson<T>(file: string, fallback: T): T {
  if (!existsSync(file)) return fallback;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

const configFile = () => join(paths().config, "config.json");
const ledgerFile = () => join(paths().config, "installs.json");

export function apiUrl(): string {
  return (process.env.HACK0_API_URL ?? DEFAULT_API).replace(/\/$/, "");
}

export function loadKey(): { key: string; source: "env" | "config" } | null {
  if (process.env.HACK0_KEY) return { key: process.env.HACK0_KEY, source: "env" };
  const key = readJson<Config>(configFile(), {}).key;
  return key ? { key, source: "config" } : null;
}

export function saveKey(key: string, email: string): string {
  ensureHome(paths());
  atomicWriteJson(configFile(), { key, email }, { mode: 0o600 });
  return configFile();
}

export function clearKey(): boolean {
  const had = Boolean(readJson<Config>(configFile(), {}).key);
  if (had) atomicWriteJson(configFile(), {}, { mode: 0o600 });
  return had;
}

export function readLedger(): InstallRecord[] {
  return readJson<InstallRecord[]>(ledgerFile(), []);
}

export function writeLedger(records: InstallRecord[]): void {
  ensureHome(paths());
  atomicWriteJson(ledgerFile(), records);
}
