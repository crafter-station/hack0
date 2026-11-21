import { sql } from "./db";

const LIMITS = { body: { min: 20, max: 1200 }, name: { min: 2, max: 80 }, role: 80, link: 200 } as const;

type TestimonialInput = { body: string; name: string; role: string | null; link: string | null };

export type Field = keyof TestimonialInput;
export type FieldErrors = Partial<Record<Field, string>>;
type Parsed = { ok: true; value: TestimonialInput } | { ok: false; errors: FieldErrors };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HANDLE = /^@?([A-Za-z0-9_]{1,30})$/;
const BARE_HOST = /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i;

function text(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : "";
}

/** A typed handle, a bare domain or a full URL, as one https link. `@railly` is read as an X handle. */
export function normalizeLink(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const handle = HANDLE.exec(v);
  if (handle && v.startsWith("@")) return `https://x.com/${handle[1]}`;
  const candidate = BARE_HOST.test(v) ? `https://${v}` : v;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString().replace(/\/$/, "") : null;
  } catch {
    return null;
  }
}

function checkBody(body: string): string | undefined {
  if (body.length < LIMITS.body.min) return `Escribe al menos ${LIMITS.body.min} caracteres.`;
  if (body.length > LIMITS.body.max) return `Máximo ${LIMITS.body.max} caracteres.`;
}

function checkName(name: string): string | undefined {
  if (name.length < LIMITS.name.min) return "¿Cómo te llamamos?";
  if (name.length > LIMITS.name.max) return `Máximo ${LIMITS.name.max} caracteres.`;
}

/** Reads the form as typed; every message is meant to sit under its field. */
export function parseTestimonial(form: FormData): Parsed {
  const body = text(form, "body");
  const name = text(form, "name").replace(/\s+/g, " ");
  const role = text(form, "role").replace(/\s+/g, " ");
  const rawLink = text(form, "link");
  const link = normalizeLink(rawLink);
  const errors: FieldErrors = {
    body: checkBody(body),
    name: checkName(name),
    role: role.length > LIMITS.role ? `Máximo ${LIMITS.role} caracteres.` : undefined,
    link: rawLink && (!link || link.length > LIMITS.link) ? "Pega un link, o un @usuario de X." : undefined,
  };
  const failed = Object.fromEntries(Object.entries(errors).filter(([, m]) => m)) as FieldErrors;
  if (Object.keys(failed).length > 0) return { ok: false, errors: failed };
  return { ok: true, value: { body, name, role: role || null, link } };
}

/** Who writes it, as Clerk knows them: the photo and email come from the account, never from the form. */
type Author = { userId: string; avatarUrl: string | null; email: string | null; verified: boolean };

/** One testimonial per account and workshop. Sending again rewrites it and puts it back in review. */
export async function saveTestimonial(workshopId: string, input: TestimonialInput, author: Author): Promise<void> {
  await sql()`
    insert into testimonials (workshop_id, user_id, body, name, role, link, avatar_url, email, verified)
    values (${workshopId}, ${author.userId}, ${input.body}, ${input.name}, ${input.role}, ${input.link},
      ${author.avatarUrl}, ${author.email}, ${author.verified})
    on conflict (workshop_id, user_id) do update set
      body = excluded.body, name = excluded.name, role = excluded.role, link = excluded.link,
      avatar_url = excluded.avatar_url, email = excluded.email, verified = excluded.verified,
      status = 'pending', updated_at = now()`;
}

type OwnTestimonial = { body: string; name: string; role: string | null; link: string | null; status: string };

export async function ownTestimonial(workshopId: string, userId: string): Promise<OwnTestimonial | null> {
  const rows = (await sql()`
    select body, name, role, link, status from testimonials
    where workshop_id = ${workshopId} and user_id = ${userId}`) as OwnTestimonial[];
  return rows[0] ?? null;
}

type Row = {
  id: string;
  name: string;
  role: string | null;
  link: string | null;
  body: string;
  avatar_url: string | null;
  email: string | null;
  verified: boolean;
  status: string;
  created_at: Date | string;
};

function publicView(r: Row) {
  return {
    name: r.name,
    role: r.role,
    link: r.link,
    avatarUrl: r.avatar_url,
    body: r.body,
    verified: r.verified,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

/** Approved testimonials, newest first. Email, account and id never leave the server. */
export async function approvedTestimonials(workshopId: string) {
  const rows = (await sql()`
    select name, role, link, body, avatar_url, verified, created_at from testimonials
    where workshop_id = ${workshopId} and status = 'approved'
    order by created_at desc`) as Row[];
  return rows.map(publicView);
}

/** Every testimonial for the admin: pending first, then approved, then hidden. */
export async function testimonialsForReview() {
  const rows = (await sql()`
    select id, name, role, link, body, avatar_url, email, verified, status, created_at from testimonials
    order by case status when 'pending' then 0 when 'approved' then 1 else 2 end, created_at desc
    limit 200`) as Row[];
  return rows.map((r) => ({ ...publicView(r), id: r.id, email: r.email, status: r.status }));
}

export async function pendingTestimonials(): Promise<number> {
  const rows = (await sql()`select count(*)::int as n from testimonials where status = 'pending'`) as { n: number }[];
  return rows[0]?.n ?? 0;
}

export async function decideTestimonial(id: string, status: "approved" | "hidden" | "pending"): Promise<void> {
  if (!UUID.test(id)) return;
  await sql()`update testimonials set status = ${status}, updated_at = now() where id = ${id}`;
}
