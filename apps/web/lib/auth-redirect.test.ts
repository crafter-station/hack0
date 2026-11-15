import { expect, test } from "bun:test";
import { redirectPath, signInRedirects, signUpRedirects } from "./auth-redirect";

test("keeps a path on this site", () => {
  expect(redirectPath("/taste-hacking/material", "hack0.dev")).toBe("/taste-hacking/material");
  expect(redirectPath(["/admin", "/other"], null)).toBe("/admin");
});

test("reduces an absolute URL on the same host to its path", () => {
  expect(redirectPath("https://hack0.dev/admin?tab=eventos#top", "hack0.dev")).toBe("/admin?tab=eventos#top");
  expect(redirectPath("http://localhost:3000/admin", "localhost:3000")).toBe("/admin");
});

test("drops a destination on another site", () => {
  expect(redirectPath("https://evil.example/admin", "hack0.dev")).toBeNull();
  expect(redirectPath("//evil.example", "hack0.dev")).toBeNull();
  expect(redirectPath("/\\evil.example", "hack0.dev")).toBeNull();
  expect(redirectPath("javascript:alert(1)", "hack0.dev")).toBeNull();
  expect(redirectPath("https://hack0.dev/admin", null)).toBeNull();
});

test("reads nothing from a missing parameter", () => {
  expect(redirectPath(undefined, "hack0.dev")).toBeNull();
  expect(redirectPath("", "hack0.dev")).toBeNull();
});

test("forces the destination for both flows only when there is one", () => {
  const to = "/taste-hacking/material";
  expect(signInRedirects(to)).toMatchObject({ forceRedirectUrl: to, signUpForceRedirectUrl: to });
  expect(signUpRedirects(to)).toMatchObject({ forceRedirectUrl: to, signInForceRedirectUrl: to });
  expect(signInRedirects(null)).toEqual({ fallbackRedirectUrl: "/", signUpFallbackRedirectUrl: "/" });
  expect(signUpRedirects(null)).toEqual({ fallbackRedirectUrl: "/", signInFallbackRedirectUrl: "/" });
});
