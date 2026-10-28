const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto", style: "short" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000_000],
  ["month", 2_592_000_000],
  ["week", 604_800_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

/** "hace 3 horas", "en 2 días", "nunca". */
export function relative(date: Date | null, now = Date.now()) {
  if (!date) return "nunca";
  const diff = date.getTime() - now;
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return "ahora";
}

export const fullDate = (d: Date | null) => (d ? new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(d) : "");

/** A sync error in one plain sentence; the raw message stays available as a tooltip. */
export function humanError(raw: string | null): string | null {
  if (!raw) return null;
  if (/rate limit/i.test(raw)) return "Luma está limitando las solicitudes. Se reintenta solo.";
  if (/not found or is not publicly accessible/i.test(raw)) return "El grupo no existe o no es público.";
  if (/duplicate of source/i.test(raw)) return "Es el mismo calendario que otra fuente.";
  if (/no Luma calendar behind/i.test(raw)) return "No hay un calendario de Luma en esa URL.";
  if (/API key/i.test(raw)) return "La API key no es válida.";
  return "El último sync falló.";
}

export type Tone = "ok" | "busy" | "warn" | "off";

export function syncTone(status: string, enabled: boolean): { tone: Tone; label: string } {
  if (!enabled) return { tone: "off", label: "Pausada" };
  if (status === "completed") return { tone: "ok", label: "Al día" };
  if (status === "running") return { tone: "busy", label: "Sincronizando" };
  if (status === "queued") return { tone: "busy", label: "En cola" };
  if (status === "failed") return { tone: "warn", label: "Con error" };
  return { tone: "off", label: "Sin sincronizar" };
}
