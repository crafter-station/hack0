import type { Metadata } from "next";
import Link from "next/link";
import { ownTestimonial } from "@/lib/testimonials";
import { WORKSHOP } from "../workshop";
import { me } from "./author";
import { type Draft, TestimonialForm } from "./form";
import { Preview } from "./preview";
import "./testimonials.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Tu testimonio · Taste hacking",
  description: "Cuéntanos qué te llevaste del workshop 01 de taste hacking.",
  alternates: { canonical: "/taste-hacking/testimonials" },
  robots: { index: false, follow: false },
};

const SIGN_IN = `/sign-in?redirect_url=${encodeURIComponent("/taste-hacking/testimonials")}`;

const SAMPLE: Draft = {
  body: "Aprendí a nombrar lo que veo antes de pedírselo al agente. Rehíce el seat map en una tarde.",
  name: "Tu nombre",
  role: "lo que haces",
  link: "",
};

/** Signed out: one way in. Name and photo come from the account, so there is nothing to type yet. */
function SignedOut() {
  return (
    <div className="th-t-grid">
      <div className="th-t-main">
        <header className="th-t-intro">
          <p className="th-label">workshop 01 · {WORKSHOP.day}</p>
          <h1>Cuéntanos qué te llevaste</h1>
          <p className="th-t-lead">
            Entra con tu cuenta: tu nombre y tu foto salen de ahí. Si es la de tu compra, lleva la marca de asistente.
          </p>
        </header>
        <div className="th-t-send">
          <Link className="th-cta" href={SIGN_IN}>
            Entrar para escribirlo <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
      <Preview draft={SAMPLE} avatarUrl={null} verified />
    </div>
  );
}

export default async function TestimonialsPage() {
  const author = await me();
  if (!author) {
    return (
      <main className="th-t">
        <SignedOut />
      </main>
    );
  }
  const own = await ownTestimonial(WORKSHOP.id, author.userId);
  const initial: Draft = {
    body: own?.body ?? "",
    name: own?.name ?? author.name,
    role: own?.role ?? "",
    link: own?.link ?? "",
  };
  return (
    <main className="th-t">
      <TestimonialForm initial={initial} avatarUrl={author.avatarUrl} verified={author.verified} status={own?.status ?? null} />
    </main>
  );
}
