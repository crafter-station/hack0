"use client";

import { useSyncExternalStore } from "react";

type SessionProgress = { t: number; done: boolean };
type Store = Record<string, SessionProgress>;

const KEY = "th:sessions";
const CHANGE = "th:sessions-change";
const EMPTY: Store = {};

let raw: string | null = null;
let parsed: Store = EMPTY;

function load(): Store {
  let next: string | null = null;
  try {
    next = localStorage.getItem(KEY);
  } catch {
    return parsed;
  }
  if (next === raw) return parsed;
  raw = next;
  try {
    const value: unknown = next ? JSON.parse(next) : null;
    parsed = typeof value === "object" && value !== null ? (value as Store) : EMPTY;
  } catch {
    parsed = EMPTY;
  }
  return parsed;
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** How far the viewer got in each session, kept on this device only. */
export function useSessionProgress(): Store {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}

export function readSessionProgress(slug: string): SessionProgress | undefined {
  return load()[slug];
}

/** A finished session stays finished when it is replayed. */
export function saveSessionProgress(slug: string, t: number, ended: boolean) {
  const store = load();
  const done = ended || store[slug]?.done === true;
  const next = { ...store, [slug]: { t: ended ? 0 : Math.max(0, Math.floor(t)), done } };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(CHANGE));
}

export function clock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
