// cligentic block: atomic-write
//
// Write files atomically: write to a temp file, fsync, rename. Prevents
// corruption from crashes, power loss, or concurrent CLI processes.
//
// Design rules:
//   1. Write to a .tmp sibling file first.
//   2. fsync before rename to ensure data hits disk.
//   3. rename() is atomic on POSIX. On Windows, unlink target first.
//   4. Enforce file mode (default 0o644, 0o600 for secrets).
//   5. Create parent directories if they don't exist.
//
// Usage:
//   import { atomicWrite, atomicWriteJson } from "./foundation/atomic-write";
//
//   atomicWrite("~/.myapp/config.toml", tomlString);
//   atomicWriteJson("~/.myapp/session.json", session, { mode: 0o600 });

import { closeSync, existsSync, fdatasyncSync, mkdirSync, openSync, renameSync, unlinkSync, writeSync } from "node:fs";
import { platform } from "node:os";
import { dirname, join } from "node:path";

export type WriteOptions = {
  /** File permissions. Default 0o644. Use 0o600 for secrets. */
  mode?: number;
  /** Encoding for string content. Default "utf8". */
  encoding?: BufferEncoding;
};

/**
 * Writes content to a file atomically. The file either contains the old
 * content or the new content, never a partial write.
 *
 * Steps:
 *   1. Create parent directories if missing
 *   2. Write to {path}.tmp
 *   3. fsync to flush to disk
 *   4. On Windows: unlink target if it exists (rename doesn't overwrite)
 *   5. rename .tmp to target (atomic on POSIX)
 */
export function atomicWrite(filePath: string, content: string | Buffer, options: WriteOptions = {}): void {
  const { mode = 0o644, encoding = "utf8" } = options;
  const dir = dirname(filePath);
  const tmpPath = join(dir, `.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`);

  mkdirSync(dir, { recursive: true });

  const data = typeof content === "string" ? Buffer.from(content, encoding) : content;
  const fd = openSync(tmpPath, "w", mode);
  try {
    writeSync(fd, data);
    fdatasyncSync(fd);
  } finally {
    closeSync(fd);
  }

  // Windows rename() fails if target exists. Unlink first.
  if (platform() === "win32" && existsSync(filePath)) {
    unlinkSync(filePath);
  }

  renameSync(tmpPath, filePath);
}

/**
 * Convenience: atomically write a JSON-serializable value with 2-space
 * indentation and a trailing newline. Common pattern for config/session files.
 */
export function atomicWriteJson(filePath: string, value: unknown, options: WriteOptions = {}): void {
  atomicWrite(filePath, `${JSON.stringify(value, null, 2)}\n`, options);
}
