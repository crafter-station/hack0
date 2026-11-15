import { expect, test } from "bun:test";
import { tokenizeShell } from "./shell-tokens";

const kinds = (line: string) =>
  tokenizeShell(line)
    .filter((t) => t.kind !== "space")
    .map((t) => `${t.kind}:${t.text}`);

test("tokens join back into the command", () => {
  for (const line of ["npx @crafter/hack0 login <tu key>", "  git  commit -m x ", "a < b", ""]) {
    expect(
      tokenizeShell(line)
        .map((t) => t.text)
        .join(""),
    ).toBe(line);
  }
});

test("runner, package, subcommand and placeholder", () => {
  expect(kinds("npx @crafter/hack0 login <tu key>")).toEqual(["bin:npx", "pkg:@crafter/hack0", "sub:login", "placeholder:<tu key>"]);
});

test("an id after the subcommand is an argument, not a subcommand", () => {
  expect(kinds("npx @crafter/hack0 add 01-taste-hacking")).toEqual(["bin:npx", "pkg:@crafter/hack0", "sub:add", "arg:01-taste-hacking"]);
});

test("nested subcommands and an email", () => {
  expect(kinds("npx @crafter/hack0 auth recover ana+x@mail.com")).toEqual([
    "bin:npx",
    "pkg:@crafter/hack0",
    "sub:auth",
    "sub:recover",
    "email:ana+x@mail.com",
  ]);
});

test("flags, paths and words after an argument", () => {
  expect(kinds("hack0 add --dir ./skills demo extra")).toEqual([
    "bin:hack0",
    "sub:add",
    "flag:--dir",
    "path:./skills",
    "arg:demo",
    "arg:extra",
  ]);
});
