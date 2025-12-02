"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Check, Bell, Mail } from "lucide-react";
import Link from "next/link";

type SubscriptionStatus = "checking" | "idle" | "loading" | "pending" | "subscribed" | "error";

export function SubscribeForm() {
  const { isSignedIn, isLoaded, user } = useUser();
  const [status, setStatus] = useState<SubscriptionStatus>("checking");
  const [error, setError] = useState("");

  const email = user?.primaryEmailAddress?.emailAddress;

  // Check subscription status on mount
  useEffect(() => {
    if (!isLoaded) return;
    if (!email) {
      setStatus("idle");
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/subscribe/status?email=${encodeURIComponent(email)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.isVerified && data.isActive) {
            setStatus("subscribed");
          } else if (data.exists && !data.isVerified) {
            setStatus("pending");
          } else {
            setStatus("idle");
          }
        } else {
          setStatus("idle");
        }
      } catch {
        setStatus("idle");
      }
    };

    checkStatus();
  }, [email, isLoaded]);

  const handleSubscribe = async () => {
    if (!email) return;

    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setError(data.error || "Error al suscribirse");
        return;
      }

      // Si ya estaba suscrito
      if (data.alreadySubscribed) {
        setStatus("subscribed");
      } else {
        setStatus("pending");
      }
    } catch {
      setStatus("error");
      setError("Error de conexión");
    }
  };

  // Cargando Clerk o verificando estado
  if (!isLoaded || status === "checking") {
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
        href="/sign-in?redirect_url=/"
        className="inline-flex h-9 items-center gap-2 rounded-md bg-foreground px-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        title="Recibe alertas de nuevos eventos"
      >
        <Bell className="h-3.5 w-3.5" />
        No te pierdas nada
      </Link>
    );
  }

  // Ya suscrito y verificado
  if (status === "subscribed") {
    return (
      <button
        disabled
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground cursor-default"
        title="Recibirás alertas de nuevos eventos"
      >
        <Check className="h-3.5 w-3.5 text-emerald-500" />
        Notificaciones activas
      </button>
    );
  }

  // Pendiente de verificación
  if (status === "pending") {
    return (
      <button
        disabled
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground cursor-default"
        title="Revisa tu bandeja de entrada"
      >
        <Mail className="h-3.5 w-3.5" />
        <span>Confirma en <span className="text-foreground">{email}</span></span>
      </button>
    );
  }

  // Logueado, puede suscribirse (status === "idle" | "loading" | "error")
  return (
    <div className="relative">
      <button
        onClick={handleSubscribe}
        disabled={status === "loading"}
        className="inline-flex h-9 items-center gap-2 rounded-md bg-foreground px-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
        title="Recibe alertas de nuevos eventos"
      >
        {status === "loading" ? (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background border-t-transparent" />
        ) : (
          <Bell className="h-3.5 w-3.5" />
        )}
        No te pierdas nada
      </button>
      {status === "error" && error && (
        <p className="absolute -bottom-5 left-0 text-xs text-red-500 whitespace-nowrap">
          {error}
        </p>
      )}
    </div>
  );
}
