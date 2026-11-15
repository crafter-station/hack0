import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { accessMail, keyMail, type Mail, THEMES } from "../lib/mail-template";

// Renders the workshop mails to /tmp with a fake key. Sends nothing.
// bun apps/web/scripts/preview-email.ts
const localAssets = `file://${resolve(import.meta.dir, "../public/email")}`;
const sample = { email: "ana@ejemplo.com", key: "h0_k7m2qxw4d5rtn3vb6ayzhf2pjc5ge7ul", workshop: "01-taste-hacking" };

function write(name: string, mail: Mail) {
  const path = `/tmp/hack0-email-${name}.html`;
  writeFileSync(path, mail.html.replaceAll("https://hack0.dev/email", localAssets));
  console.info(path);
}

write("preview", keyMail(sample));
write("conservative", keyMail(sample, THEMES.paper));
write("bolder", keyMail(sample, THEMES.globe));
write("rotated", keyMail({ ...sample, workshop: null }));
write("access", accessMail(sample.workshop));
writeFileSync("/tmp/hack0-email-preview.txt", keyMail(sample).text);
console.info("/tmp/hack0-email-preview.txt");
