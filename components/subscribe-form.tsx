"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error || "Error al suscribirse");
        return;
      }

      setStatus("success");
      setMessage(data.message);
    } catch {
      setStatus("error");
      setMessage("Error de conexión");
    }
  };

  if (status === "success") {
    return (
      <div className="flex h-10 items-center gap-2 rounded-full border border-border bg-muted/50 px-4">
        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
        <span className="text-sm text-muted-foreground">
          Revisa tu email para confirmar
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex h-10 items-center rounded-full border border-border bg-muted/50 pl-4 pr-1 transition-colors focus-within:border-muted-foreground/50">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
          disabled={status === "loading"}
          className="h-full flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-default"
        />
        <button
          type="submit"
          disabled={status === "loading" || !email}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-all hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-default"
        >
          {status === "loading" ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background border-t-transparent" />
          ) : (
            <ArrowRight className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      {status === "error" && message && (
        <p className="absolute -bottom-5 left-4 text-xs text-red-500">
          {message}
        </p>
      )}
    </form>
  );
}
