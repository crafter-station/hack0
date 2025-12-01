"use client";

import { useState } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { ArrowRight, Check, Bell } from "lucide-react";

export function SubscribeForm() {
  const { isSignedIn, user } = useUser();
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

  if (!isSignedIn) {
    return (
      <SignInButton mode="redirect">
        <button className="flex h-10 items-center gap-2 rounded-full border border-border bg-muted/50 px-4 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Bell className="h-4 w-4" />
          Inicia sesión para alertas
        </button>
      </SignInButton>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleSubscribe}
        disabled={status === "loading"}
        className="flex h-10 items-center gap-2 rounded-full border border-border bg-muted/50 px-4 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-default"
      >
        {status === "loading" ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        Activar alertas
      </button>
      {status === "error" && message && (
        <p className="absolute -bottom-5 left-4 text-xs text-red-500">
          {message}
        </p>
      )}
    </div>
  );
}
