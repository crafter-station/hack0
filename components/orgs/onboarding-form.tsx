"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ORGANIZER_TYPE_LABELS } from "@/lib/db/schema";
import {
  createOrganization,
  generateSlug,
  isSlugAvailable,
} from "@/lib/actions/organizations";
import { Loader2, ArrowRight, Check, X } from "lucide-react";

const ORGANIZER_TYPE_OPTIONS = Object.entries(ORGANIZER_TYPE_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  })
);

export function OnboardingForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManuallyEdited && name) {
      generateSlug(name).then(setSlug);
    }
  }, [name, slugManuallyEdited]);

  // Check slug availability
  useEffect(() => {
    if (!slug) {
      setSlugStatus("idle");
      return;
    }

    const timeout = setTimeout(async () => {
      setSlugStatus("checking");
      const available = await isSlugAvailable(slug);
      setSlugStatus(available ? "available" : "taken");
    }, 500);

    return () => clearTimeout(timeout);
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      await createOrganization({
        name: formData.get("name") as string,
        slug,
        description: (formData.get("description") as string) || undefined,
        type: (formData.get("type") as string) || undefined,
        websiteUrl: (formData.get("websiteUrl") as string) || undefined,
        logoUrl: (formData.get("logoUrl") as string) || undefined,
      });

      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear la organización"
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Información básica
        </h2>
        <div className="grid gap-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Nombre de la organización *
            </label>
            <Input
              id="name"
              name="name"
              placeholder="ej. GDG Lima, Universidad Nacional de Ingeniería"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="slug" className="text-sm font-medium">
              URL personalizada *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">hack0.dev/org/</span>
              <div className="relative flex-1">
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  }}
                  placeholder="mi-organizacion"
                  required
                  className="pr-8"
                />
                {slugStatus !== "idle" && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {slugStatus === "checking" && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {slugStatus === "available" && (
                      <Check className="h-4 w-4 text-emerald-500" />
                    )}
                    {slugStatus === "taken" && (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
            </div>
            {slugStatus === "taken" && (
              <p className="text-xs text-red-500">Esta URL ya está en uso</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Descripción
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder="Breve descripción de tu organización..."
              className="min-h-20 resize-none"
            />
          </div>
        </div>
      </section>

      {/* Type */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Tipo de organización
        </h2>
        <div className="grid gap-4">
          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              Tipo *
            </label>
            <Select name="type" required>
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {ORGANIZER_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Links */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Enlaces (opcional)
        </h2>
        <div className="grid gap-4">
          <div className="space-y-2">
            <label htmlFor="websiteUrl" className="text-sm font-medium">
              Sitio web
            </label>
            <Input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              placeholder="https://gdg.community.dev/gdg-lima"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="logoUrl" className="text-sm font-medium">
              URL del logo
            </label>
            <Input
              id="logoUrl"
              name="logoUrl"
              type="url"
              placeholder="https://ejemplo.com/logo.png"
            />
            <p className="text-xs text-muted-foreground">
              Sube tu logo a algún servicio y pega la URL aquí
            </p>
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          type="submit"
          disabled={isSubmitting || slugStatus === "taken" || slugStatus === "checking"}
          className="min-w-32"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            <>
              Crear organización
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
