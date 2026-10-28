"use client";

import Form from "next/form";
import type { ReactNode } from "react";

/** A GET form that submits itself when a select changes; without JS it still works with its button. */
export function AutoSubmitForm({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Form
      action="/eventos"
      className={className}
      onChange={(e) => {
        if (e.target instanceof HTMLSelectElement) e.currentTarget.requestSubmit();
      }}
    >
      {children}
    </Form>
  );
}
