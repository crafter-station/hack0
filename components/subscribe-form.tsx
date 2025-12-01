"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Check, Bell } from "lucide-react";
import Link from "next/link";

export function SubscribeForm() {
  const { isSignedIn, isLoaded, user } = useUser();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.primaryEmailAddress.emailAddress }),
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

  // Suscrito exitosamente
  if (status === "success") {
    return (
      <button
        disabled
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground cursor-default"
      >
        <Check className="h-3.5 w-3.5 text-emerald-500" />
        Suscrito
      </button>
    );
  }

  // Cargando Clerk
  if (!isLoaded) {
    return (
      <button
        disabled
        className="inline-flex h-9 items-center gap-2 rounded-md bg-foreground px-3 text-sm font-medium text-background opacity-50"
      >
        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background border-t-transparent" />
      </button>
    );
  }

  // No logueado
  if (!isSignedIn) {
    return (
      <Link
        href="/sign-in"
        className="inline-flex h-9 items-center gap-2 rounded-md bg-foreground px-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
      >
        <Bell className="h-3.5 w-3.5" />
        Alertas
      </Link>
    );
  }

  // Logueado, puede suscribirse
  return (
    <div className="relative">
      <button
        onClick={handleSubscribe}
        disabled={status === "loading"}
        className="inline-flex h-9 items-center gap-2 rounded-md bg-foreground px-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
      >
        {status === "loading" ? (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background border-t-transparent" />
        ) : (
          <Bell className="h-3.5 w-3.5" />
        )}
        Alertas
      </button>
      {status === "error" && message && (
        <p className="absolute -bottom-5 left-0 text-xs text-red-500 whitespace-nowrap">
          {message}
        </p>
      )}
    </div>
  );
}
