/**
 * The JSON contract agents depend on. Every command emits one Envelope on
 * stdout in JSON mode. Shape changes bump CONTRACT_VERSION.
 */

export const CONTRACT_VERSION = "1";

export type Envelope<T = unknown> = {
  version: string;
  command: string;
  timestamp: string;
  ok: boolean;
  result?: T;
  error?: EnvelopeError;
  nextSteps?: NextStep[];
};

export type EnvelopeError = {
  /** Stable, dot-separated: "auth.missing-key" */
  code: string;
  message: string;
  hint?: string;
  retryable: boolean;
};

export type NextStep = { command: string; reason: string };

export const EXIT = {
  ok: 0,
  runtime: 1,
  usage: 2,
  auth: 3,
  notFound: 4,
  forbidden: 5,
  network: 6,
  conflict: 7,
} as const;

export type ExitCode = (typeof EXIT)[keyof typeof EXIT];

export type CatalogItem = {
  id: string;
  title: string;
  version: string;
  free: boolean;
  owned: boolean;
};

export type BundleFile = {
  path: string;
  kind: "skill" | "material";
  encoding: "utf8" | "base64";
  content: string;
};

export type Bundle = {
  id: string;
  title: string;
  version: string;
  free: boolean;
  files: BundleFile[];
  links: { title: string; url: string }[];
};

export type Manifest = {
  id: string;
  title: string;
  version: string;
  free: boolean;
  skills: string[];
  materials?: string[];
  links?: { title: string; url: string }[];
};

export type InstallRecord = {
  id: string;
  version: string;
  agent: Agent;
  global: boolean;
  root: string;
  paths: string[];
  installedAt: string;
};

export type Agent = "claude" | "agents";
