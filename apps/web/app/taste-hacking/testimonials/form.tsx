"use client";

import { type KeyboardEvent, useActionState, useEffect, useRef, useState } from "react";
import type { Field } from "@/lib/testimonials";
import { type SendState, sendTestimonial } from "./actions";
import { Preview } from "./preview";

export type Draft = { body: string; name: string; role: string; link: string };

const DRAFT_KEY = "th-testimonial-draft";
const MAX = 1200;
const STARTERS = ["Me sirvió", "Antes yo", "Me sorprendió", "Se lo recomiendo a"];
const SHARE_URL = "https://hack0.dev/taste-hacking";

function readDraft(): Partial<Draft> {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}") as Partial<Draft>;
  } catch (e) {
    console.warn("testimonial draft unreadable, starting empty", e);
    return {};
  }
}

/** Keeps what was typed across reloads. A saved testimonial wins over an old draft, so the draft only fills a new one. */
function useDraft(initial: Draft, hasSaved: boolean) {
  const [draft, setDraft] = useState(initial);
  const loaded = useRef(false);
  useEffect(() => {
    if (!hasSaved) {
      const saved = readDraft();
      setDraft((d) => {
        const merged = { ...d };
        for (const k of Object.keys(d) as (keyof Draft)[]) if (saved[k]) merged[k] = saved[k];
        return merged;
      });
    }
    loaded.current = true;
  }, [hasSaved]);
  useEffect(() => {
    if (loaded.current) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);
  return [draft, setDraft] as const;
}

function errorsOf(state: SendState): Partial<Record<Field, string>> {
  return state.status === "invalid" ? state.errors : {};
}

type InputProps = {
  field: "name" | "role" | "link";
  label: string;
  draft: Draft;
  error?: string;
  onChange: (field: keyof Draft, value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">;

function Input({ field, label, draft, error, onChange, ...rest }: InputProps) {
  return (
    <div className="th-t-field">
      <label htmlFor={`th-t-${field}`}>{label}</label>
      <input
        id={`th-t-${field}`}
        name={field}
        value={draft[field]}
        onChange={(e) => onChange(field, e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `th-t-${field}-err` : undefined}
        {...rest}
      />
      {error && (
        <p id={`th-t-${field}-err`} className="th-t-err">
          {error}
        </p>
      )}
    </div>
  );
}

function Thanks({ name, body, onEdit }: { name: string; body: string; onEdit: () => void }) {
  const share = `https://x.com/intent/post?text=${encodeURIComponent(`${body.slice(0, 200)}\n\nTaste hacking, de @raillyhugo`)}&url=${encodeURIComponent(SHARE_URL)}`;
  return (
    <div className="th-t-thanks" role="status">
      <p className="th-label">workshop 01</p>
      <h1>Gracias{name ? `, ${name.split(" ")[0]}` : ""}.</h1>
      <p>Lo leemos y aparece en la web del curso cuando lo aprobemos.</p>
      <div className="th-t-thanks-actions">
        <a className="th-cta" href={share} target="_blank" rel="noopener noreferrer">
          Compartirlo en X <span aria-hidden="true">↗</span>
        </a>
        <button type="button" className="th-t-ghost" onClick={onEdit}>
          Editar lo que escribí
        </button>
      </div>
    </div>
  );
}

/** Puts a starter phrase at the end of what is typed. */
function insertStarter(text: string, starter: string): string {
  if (!text.trim()) return `${starter} `;
  return `${text.replace(/\s+$/, "")}\n${starter} `;
}

function BodyMeta({ length, error }: { length: number; error?: string }) {
  return (
    <p className="th-t-meta">
      {error ? (
        <span id="th-t-body-err" className="th-t-err">
          {error}
        </span>
      ) : (
        <span />
      )}
      <span className="th-t-count" data-near={length > MAX - 100 ? "true" : undefined}>
        {length} / {MAX}
      </span>
    </p>
  );
}

function sendLabel(pending: boolean, status: string | null): string {
  if (pending) return "Enviando…";
  return status ? "Guardar cambios" : "Enviar testimonio";
}

const STATUS_NOTE: Record<string, string> = {
  pending: "Ya nos llegó el tuyo y está en revisión. Si lo cambias, lo guardamos encima.",
  approved: "El tuyo ya está publicado. Si lo cambias, vuelve a revisión.",
  hidden: "Ya nos llegó el tuyo. Si lo cambias, lo volvemos a leer.",
};

type Props = { initial: Draft; avatarUrl: string | null; verified: boolean; status: string | null };

export function TestimonialForm({ initial, avatarUrl, verified, status }: Props) {
  const [state, action, pending] = useActionState(sendTestimonial, { status: "idle" });
  const [draft, setDraft] = useDraft(initial, status !== null);
  const [editing, setEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const errors = errorsOf(state);

  const set = (field: keyof Draft, value: string) => setDraft((d) => ({ ...d, [field]: value }));

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) bodyRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (state.status === "invalid") formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
    if (state.status === "saved") {
      localStorage.removeItem(DRAFT_KEY);
      setEditing(false);
    }
    if (state.status === "signed-out") window.location.reload();
  }, [state]);

  const addStarter = (s: string) => {
    const next = insertStarter(draft.body, s);
    set("body", next);
    requestAnimationFrame(() => {
      const el = bodyRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(next.length, next.length);
    });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const saved = state.status === "saved" && !editing;
  const note = status ? STATUS_NOTE[status] : null;

  return (
    <div className="th-t-grid" data-mode={saved ? "saved" : "form"}>
      <div className="th-t-main">
        {saved ? (
          <Thanks name={draft.name} body={draft.body} onEdit={() => setEditing(true)} />
        ) : (
          <form ref={formRef} action={action} onKeyDown={onKeyDown} className="th-t-form" noValidate>
            <header className="th-t-intro">
              <p className="th-label">workshop 01 · tu testimonio</p>
              <h1>
                <label htmlFor="th-t-body">¿Qué te llevaste del workshop?</label>
              </h1>
              <p className="th-t-lead">{note ?? "Dos o tres líneas bastan. Lo leemos antes de publicarlo en la web del curso."}</p>
            </header>

            <div className="th-t-field th-t-body">
              <ul className="th-t-starters" aria-label="Para empezar">
                {STARTERS.map((s) => (
                  <li key={s}>
                    <button type="button" onClick={() => addStarter(s)}>
                      {s}…
                    </button>
                  </li>
                ))}
              </ul>
              <textarea
                ref={bodyRef}
                id="th-t-body"
                name="body"
                rows={4}
                maxLength={MAX}
                value={draft.body}
                onChange={(e) => set("body", e.target.value)}
                placeholder="Lo que te sirvió, lo que hiciste después, a quién se lo recomendarías."
                aria-invalid={errors.body ? true : undefined}
                aria-describedby={errors.body ? "th-t-body-err" : undefined}
              />
              <BodyMeta length={draft.body.length} error={errors.body} />
            </div>

            <div className="th-t-row">
              <Input field="name" label="Nombre" autoComplete="name" draft={draft} error={errors.name} onChange={set} />
              <Input
                field="role"
                label="Qué haces"
                placeholder="Frontend en Nubank"
                autoComplete="organization-title"
                draft={draft}
                error={errors.role}
                onChange={set}
              />
              <Input
                field="link"
                label="Link o @ de X"
                placeholder="@raillyhugo"
                inputMode="url"
                autoCapitalize="none"
                spellCheck={false}
                draft={draft}
                error={errors.link}
                onChange={set}
              />
            </div>

            <div className="th-t-send">
              <button type="submit" className="th-cta" disabled={pending}>
                {sendLabel(pending, status)} <span aria-hidden="true">→</span>
              </button>
              <p>
                <span className="th-t-kbd">
                  <kbd>⌘</kbd> <kbd>Enter</kbd> lo envía.{" "}
                </span>
                Aparece con tu nombre y foto en la web del curso; lo revisamos antes.
              </p>
              {state.status === "failed" && (
                <p className="th-t-err" role="alert">
                  No se pudo guardar. Tu texto sigue aquí; prueba otra vez en un momento.
                </p>
              )}
            </div>
          </form>
        )}
      </div>
      <Preview draft={draft} avatarUrl={avatarUrl} verified={verified} />
    </div>
  );
}
