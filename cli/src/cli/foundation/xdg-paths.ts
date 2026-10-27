// cligentic block: xdg-paths
//
// XDG Base Directory Spec resolver with macOS and Windows fallbacks.
// Gives your CLI a canonical directory layout instead of inventing
// ~/.myapp/ from scratch every time.
//
// Design rules:
//   1. Respect XDG env vars on Linux (XDG_CONFIG_HOME, XDG_STATE_HOME, etc).
//   2. Fall back to platform conventions: ~/Library on macOS, %APPDATA% on Windows.
//   3. Provide an APP_HOME env var override for testing.
//   4. Create directories lazily (only when ensureHome is called).
//   5. Pure functions, no side effects except ensureHome.
//
// Usage:
//   import { getAppPaths, ensureHome } from "./foundation/xdg-paths";
//
//   const paths = getAppPaths("myapp");
//   // paths.config  = ~/.config/myapp      (Linux)
//   // paths.state   = ~/.local/state/myapp  (Linux)
//   // paths.cache   = ~/.cache/myapp        (Linux)
//   // paths.home    = ~/.config/myapp       (Linux, alias for config)
//
//   ensureHome(paths);  // creates all directories

import { mkdirSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

export type AppPaths = {
  /** Primary config directory. TOML/JSON config files live here. */
  config: string;
  /** State directory. Sessions, pending approvals, killswitch file. */
  state: string;
  /** Cache directory. Temporary data safe to delete. */
  cache: string;
  /** Alias for config. The "home" of your CLI's persistent data. */
  home: string;
  /** Audit logs directory. Append-only JSONL files. */
  audit: string;
  /** Sessions directory. Auth tokens, refresh tokens. */
  sessions: string;
  /** Temporary directory for atomic writes. */
  tmp: string;
};

/**
 * Resolves the canonical directory paths for your CLI app.
 *
 * On Linux: follows XDG Base Directory Spec.
 * On macOS: uses ~/Library/Application Support (config/state) and ~/Library/Caches.
 * On Windows: uses %APPDATA% (config) and %LOCALAPPDATA% (state/cache).
 *
 * The APP_HOME env var (e.g., MYAPP_HOME) overrides everything, useful for
 * testing and CI where you don't want to pollute the real home directory.
 */
export function getAppPaths(appName: string): AppPaths {
  const envKey = `${appName.toUpperCase().replace(/-/g, "_")}_HOME`;
  const override = process.env[envKey];

  if (override) {
    return buildPaths(override);
  }

  const os = platform();
  const home = homedir();

  if (os === "darwin") {
    const appSupport = join(home, "Library", "Application Support", appName);
    return {
      config: appSupport,
      state: appSupport,
      cache: join(home, "Library", "Caches", appName),
      home: appSupport,
      audit: join(appSupport, "audit"),
      sessions: join(appSupport, "sessions"),
      tmp: join(appSupport, "tmp"),
    };
  }

  if (os === "win32") {
    const appData = process.env.APPDATA || join(home, "AppData", "Roaming");
    const localAppData = process.env.LOCALAPPDATA || join(home, "AppData", "Local");
    const configDir = join(appData, appName);
    return {
      config: configDir,
      state: join(localAppData, appName),
      cache: join(localAppData, appName, "cache"),
      home: configDir,
      audit: join(configDir, "audit"),
      sessions: join(configDir, "sessions"),
      tmp: join(localAppData, appName, "tmp"),
    };
  }

  // Linux / WSL / other Unix: XDG
  const xdgConfig = process.env.XDG_CONFIG_HOME || join(home, ".config");
  const xdgState = process.env.XDG_STATE_HOME || join(home, ".local", "state");
  const xdgCache = process.env.XDG_CACHE_HOME || join(home, ".cache");
  const configDir = join(xdgConfig, appName);

  return {
    config: configDir,
    state: join(xdgState, appName),
    cache: join(xdgCache, appName),
    home: configDir,
    audit: join(xdgState, appName, "audit"),
    sessions: join(configDir, "sessions"),
    tmp: join(xdgCache, appName, "tmp"),
  };
}

/**
 * Creates all directories in the AppPaths tree. Idempotent.
 * Permissions: 0o700 for sensitive dirs (sessions), 0o755 for the rest.
 */
export function ensureHome(paths: AppPaths): void {
  for (const dir of [paths.config, paths.state, paths.cache, paths.audit, paths.tmp]) {
    mkdirSync(dir, { recursive: true, mode: 0o755 });
  }
  mkdirSync(paths.sessions, { recursive: true, mode: 0o700 });
}

function buildPaths(root: string): AppPaths {
  return {
    config: root,
    state: root,
    cache: join(root, "cache"),
    home: root,
    audit: join(root, "audit"),
    sessions: join(root, "sessions"),
    tmp: join(root, "tmp"),
  };
}
