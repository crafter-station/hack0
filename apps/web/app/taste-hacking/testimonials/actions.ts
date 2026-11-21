"use server";

import { type FieldErrors, parseTestimonial, saveTestimonial } from "@/lib/testimonials";
import { WORKSHOP } from "../workshop";
import { me } from "./author";

export type SendState =
  | { status: "idle" }
  | { status: "signed-out" }
  | { status: "invalid"; errors: FieldErrors }
  | { status: "failed" }
  | { status: "saved" };

export async function sendTestimonial(_prev: SendState, form: FormData): Promise<SendState> {
  const author = await me();
  if (!author) return { status: "signed-out" };
  const parsed = parseTestimonial(form);
  if (!parsed.ok) return { status: "invalid", errors: parsed.errors };
  try {
    await saveTestimonial(WORKSHOP.id, parsed.value, author);
    return { status: "saved" };
  } catch (e) {
    console.error("testimonial save failed", e);
    return { status: "failed" };
  }
}
