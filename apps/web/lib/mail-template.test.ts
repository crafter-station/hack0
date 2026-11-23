import { expect, test } from "bun:test";
import { accessMail, keyMail } from "./mail-template";

const key = "h0_k7m2qxw4d5rtn3vb6ayzhf2pjc5ge7ul";

test("the purchase mail carries the key, both commands and the recover command in text and html", () => {
  const mail = keyMail({ email: "ana@ejemplo.com", key, workshop: "01-taste-hacking" });
  expect(mail.subject).toBe("Tu clave para Taste hacking");
  for (const body of [mail.text, mail.html]) {
    expect(body).toContain(`npx @crafter/hack0 login ${key}`);
    expect(body).toContain("npx @crafter/hack0 add 01-taste-hacking");
    expect(body).toContain("npx @crafter/hack0 auth recover ana@ejemplo.com");
    expect(body).toContain("https://luma.com/hack0-lfc2");
    expect(body).toContain("tastehacking.dev/material");
  }
});

test("every image is an absolute https URL on hack0.dev", () => {
  const { html } = keyMail({ email: "ana@ejemplo.com", key, workshop: "01-taste-hacking" });
  const srcs = [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
  expect(srcs.length).toBeGreaterThan(0);
  for (const src of srcs) expect(src).toStartWith("https://hack0.dev/email/");
});

test("a workshop without metadata still gets its key and commands", () => {
  const mail = keyMail({ email: "a@b.co", key, workshop: "02-next" });
  expect(mail.subject).toBe("Tu clave para 02-next");
  expect(mail.text).toContain("npx @crafter/hack0 add 02-next");
  expect(mail.text).not.toContain("luma.com");
});

test("a rotated key says the old one stopped working and escapes the address", () => {
  const mail = keyMail({ email: "a<b>@c.co", key, workshop: null });
  expect(mail.subject).toBe("Tu nueva clave de hack0");
  expect(mail.text).toContain("La anterior dejó de funcionar.");
  expect(mail.html).toContain("a&lt;b&gt;@c.co");
  expect(mail.html).not.toContain("a<b>@c.co");
});

test("the access mail has no key", () => {
  const mail = accessMail("01-taste-hacking");
  expect(mail.html).not.toContain("h0_");
  expect(mail.text).toContain("npx @crafter/hack0 add 01-taste-hacking");
});
