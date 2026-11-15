type Workshop = { title: string; day: string; hours: string; event: string; material: string };

/** What the mail says about each workshop beyond its id. An id missing here still gets its key and commands. */
const WORKSHOPS: Record<string, Workshop> = {
  "01-taste-hacking": {
    title: "Taste hacking",
    day: "jue 19 nov",
    hours: "19:00 Lima · 21:00 Buenos Aires",
    event: "https://luma.com/hack0-lfc2",
    material: "https://hack0.dev/taste-hacking/material",
  },
};

const ASSETS = "https://hack0.dev/email";
const MONO = "'JetBrains Mono','Geist Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace";
const ACCENT = "#ff3d00";

type MailTheme = {
  bg: string;
  fg: string;
  mute: string;
  rule: string;
  /** Code blocks. */
  panel: string;
  /** The key sits on the inverse of the page so it is the first thing read. */
  keyBg: string;
  keyFg: string;
  mark: string;
  title: number;
  globe: boolean;
};

const SCANNER: MailTheme = {
  bg: "#111110",
  fg: "#f3f0e8",
  mute: "#9a988f",
  rule: "#33322e",
  panel: "#1c1c1a",
  keyBg: "#f3f0e8",
  keyFg: "#111110",
  mark: "mark-dark.png",
  title: 60,
  globe: false,
};

export const THEMES = {
  scanner: SCANNER,
  paper: {
    ...SCANNER,
    bg: "#f3f0e8",
    fg: "#111110",
    mute: "#6b6b63",
    rule: "#d5d2c8",
    panel: "#e9e5da",
    keyBg: "#111110",
    keyFg: "#f3f0e8",
    mark: "mark-light.png",
    title: 52,
  },
  globe: { ...SCANNER, title: 72, globe: true },
} satisfies Record<string, MailTheme>;

export type Mail = { subject: string; text: string; html: string };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const bare = (url: string) => url.replace(/^https:\/\//, "");

const label = (t: MailTheme, text: string) =>
  `<div style="font-family:${MONO};font-size:13px;line-height:18px;color:${t.mute};">${text}</div>`;

const para = (t: MailTheme, html: string) =>
  `<div style="font-family:${MONO};font-size:14px;line-height:22px;color:${t.fg};">${html}</div>`;

const link = (t: MailTheme, href: string, text: string) =>
  `<a href="${href}" style="color:${t.fg};text-decoration:underline;text-underline-offset:3px;">${text}</a>`;

const gap = (h: number) => `<div style="height:${h}px;line-height:${h}px;font-size:1px;">&nbsp;</div>`;

const code = (t: MailTheme, line: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td class="code" bgcolor="${t.panel}" style="background-color:${t.panel};border:1px solid ${t.rule};padding:12px 14px;font-family:${MONO};font-size:13px;line-height:20px;color:${t.fg};overflow-wrap:anywhere;word-break:break-word;">${esc(line)}</td></tr></table>`;

function step(t: MailTheme, n: string, title: string, line: string): string {
  return `<div style="font-family:${MONO};font-size:13px;line-height:20px;color:${t.fg};padding-bottom:8px;"><span style="color:${t.mute};">${n}</span>&nbsp;&nbsp;${title}</div>${code(t, line)}`;
}

function header(t: MailTheme, tag: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="left" valign="middle"><a href="https://hack0.dev" style="text-decoration:none;"><img src="${ASSETS}/${t.mark}" width="32" height="32" alt="hack0" style="display:block;border:0;"></a></td>
<td align="right" valign="middle"><span style="display:inline-block;background-color:${t.keyBg};color:${t.keyFg};font-family:${MONO};font-size:12px;line-height:16px;font-weight:700;padding:5px 9px;">${tag}</span></td>
</tr></table>`;
}

function hero(t: MailTheme, eyebrow: string, title: string): string {
  const size = t.title;
  return `<div style="font-family:${MONO};font-size:14px;line-height:20px;color:${t.mute};">${eyebrow}</div>${gap(10)}
<div style="font-family:${MONO};font-size:${size}px;line-height:${Math.round(size * 0.96)}px;font-weight:800;letter-spacing:-0.045em;color:${t.fg};">${esc(title).replace(/ /g, "<br>")}</div>${gap(28)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="2" bgcolor="${ACCENT}" style="background-color:${ACCENT};height:2px;line-height:2px;font-size:1px;">&nbsp;</td></tr></table>`;
}

function fact(t: MailTheme, name: string, value: string, note: string): string {
  return `<div style="display:inline-block;vertical-align:top;padding:0 36px 20px 0;">${label(t, name)}
<div style="font-family:${MONO};font-size:20px;line-height:30px;font-weight:800;letter-spacing:-0.02em;color:${t.fg};">${value}</div>
<div style="font-family:${MONO};font-size:13px;line-height:20px;color:${t.mute};">${note}</div></div>`;
}

function facts(t: MailTheme, w: Workshop): string {
  return `${gap(22)}<div>${fact(t, "fecha", w.day, w.hours)}${fact(t, "lugar", "online", link(t, w.event, bare(w.event)))}</div>`;
}

function keyBlock(t: MailTheme, key: string): string {
  return `${label(t, "tu clave")}${gap(10)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td class="key" bgcolor="${t.keyBg}" style="background-color:${t.keyBg};padding:18px 14px;font-family:${MONO};font-size:13px;line-height:22px;font-weight:700;color:${t.keyFg};word-break:break-all;-webkit-user-select:all;user-select:all;">${esc(key)}</td></tr></table>${gap(10)}
<div style="font-family:${MONO};font-size:13px;line-height:20px;color:${t.mute};">Se muestra una sola vez. Guarda este correo.</div>`;
}

function material(t: MailTheme, w: Workshop): string {
  return `${label(t, "material")}${gap(8)}${para(t, `${link(t, w.material, bare(w.material))}<br>Entra con este mismo correo.`)}`;
}

function footer(t: MailTheme): string {
  const globe = t.globe
    ? `<tr><td style="padding:0;"><img src="${ASSETS}/globe.png" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></td></tr>`
    : "";
  return `${globe}<tr><td class="pad" style="padding:22px 40px 36px 40px;border-top:1px solid ${t.rule};font-family:${MONO};font-size:12px;line-height:18px;color:${t.mute};">
<a href="https://hack0.dev" style="color:${t.mute};text-decoration:none;">hack0</a> · <a href="https://crafter.run" style="color:${t.mute};text-decoration:none;">Crafter Station</a></td></tr>`;
}

function shell(t: MailTheme, preheader: string, body: string): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>hack0</title>
<style>
@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700;800&display=swap");
a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}
@media (min-width:600px){.key{font-size:19px!important;padding:22px 20px!important}}
@media (max-width:480px){.pad{padding-left:24px!important;padding-right:24px!important}.code{font-size:12px!important}}
</style>
</head>
<body bgcolor="${t.bg}" style="margin:0;padding:0;background-color:${t.bg};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${t.bg};">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${t.bg}" style="background-color:${t.bg};"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="${t.bg}" style="width:100%;max-width:600px;background-color:${t.bg};">
<tr><td class="pad" style="padding:36px 40px 40px 40px;">${body}</td></tr>
${footer(t)}
</table>
</td></tr></table>
</body>
</html>`;
}

const login = (key: string) => `npx @crafter/hack0 login ${key}`;
const add = (id: string) => `npx @crafter/hack0 add ${id}`;
const recover = (email: string) => `npx @crafter/hack0 auth recover ${email}`;

/** The mail that carries a key: a first purchase (`workshop` set) or a rotation (`workshop` null). */
export function keyMail(input: { email: string; key: string; workshop: string | null }, theme: MailTheme = THEMES.globe): Mail {
  const { email, key, workshop } = input;
  const meta = workshop ? WORKSHOPS[workshop] : undefined;
  const name = meta?.title ?? workshop;
  const second = workshop ? add(workshop) : "npx @crafter/hack0 list";
  const secondTitle = workshop ? "Instala el workshop en tu proyecto" : "Mira tus workshops";
  const intro = name ? `Ya estás dentro de ${name}.` : "Esta es tu clave nueva de hack0. La anterior dejó de funcionar.";

  const text = [
    intro,
    ...(meta ? [`${meta.day}, ${meta.hours}. Online.`, `Evento: ${meta.event}`] : []),
    "",
    `Tu clave: ${key}`,
    "Se muestra una sola vez. Guarda este correo.",
    "",
    "1. Guarda tu clave",
    `   ${login(key)}`,
    `2. ${secondTitle}`,
    `   ${second}`,
    "",
    ...(meta ? [`El material vive en ${meta.material}. Entra con este mismo correo.`, ""] : []),
    `Si pierdes la clave, corre: ${recover(email)}`,
    "Te llega una nueva y la anterior deja de funcionar.",
    "",
    "hack0 · Crafter Station",
  ].join("\n");

  const t = theme;
  const body = [
    header(t, workshop ? "workshop" : "clave"),
    gap(44),
    hero(t, name ? "ya estás dentro" : "la anterior dejó de funcionar", name ?? "Clave nueva"),
    meta ? facts(t, meta) : gap(8),
    gap(20),
    keyBlock(t, key),
    gap(36),
    label(t, "instalación"),
    gap(12),
    step(t, "01", "Guarda tu clave", login(key)),
    gap(18),
    step(t, "02", secondTitle, second),
    gap(36),
    meta ? `${material(t, meta)}${gap(32)}` : "",
    label(t, "si pierdes la clave"),
    gap(10),
    code(t, recover(email)),
    gap(10),
    `<div style="font-family:${MONO};font-size:13px;line-height:20px;color:${t.mute};">Te llega una nueva y la anterior deja de funcionar.</div>`,
  ].join("\n");

  const preheader = meta ? `${meta.day}, ${meta.hours}. Tu clave se muestra una sola vez.` : "Tu clave se muestra una sola vez.";
  return { subject: name ? `Tu clave para ${name}` : "Tu nueva clave de hack0", text, html: shell(t, preheader, body) };
}

/** A later purchase: the buyer keeps their key and gets one more workshop. */
export function accessMail(workshop: string, theme: MailTheme = THEMES.globe): Mail {
  const meta = WORKSHOPS[workshop];
  const name = meta?.title ?? workshop;
  const text = [
    `Sumamos ${name} a tu clave de hack0.`,
    ...(meta ? [`${meta.day}, ${meta.hours}. Online.`, `Evento: ${meta.event}`] : []),
    "",
    `  ${add(workshop)}`,
    "",
    ...(meta ? [`El material vive en ${meta.material}. Entra con este mismo correo.`, ""] : []),
    "hack0 · Crafter Station",
  ].join("\n");
  const t = theme;
  const body = [
    header(t, "workshop"),
    gap(44),
    hero(t, "sumado a tu clave", name),
    meta ? facts(t, meta) : gap(8),
    gap(20),
    step(t, "01", "Instala el workshop en tu proyecto", add(workshop)),
    meta ? `${gap(36)}${material(t, meta)}` : "",
  ].join("\n");
  return { subject: `Tu acceso a ${name}`, text, html: shell(t, `Sumamos ${name} a tu clave de hack0.`, body) };
}
