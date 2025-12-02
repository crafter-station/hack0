"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { ORGANIZER_TYPE_LABELS } from "@/lib/db/schema";
import {
  createOrganization,
  generateSlug,
  isSlugAvailable,
} from "@/lib/actions/organizations";
import { ImageUpload } from "@/components/ui/image-upload";
import { Loader2, ArrowRight, Check, X, Globe } from "lucide-react";

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
  const [logoUrl, setLogoUrl] = useState("");

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
        logoUrl: logoUrl || undefined,
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
    <form onSubmit={handleSubmit}>
      {/* Two column layout */}
      <div className="grid md:grid-cols-[1fr_180px] gap-6">
        {/* Left column - Main info */}
        <FieldGroup>
          {/* Name */}
          <Field>
            <FieldLabel htmlFor="name">Nombre de la organización *</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="name"
                name="name"
                placeholder="ej. GDG Lima, Universidad Nacional de Ingeniería"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </InputGroup>
          </Field>

          {/* Slug */}
          <Field>
            <FieldLabel htmlFor="slug">URL personalizada *</FieldLabel>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <span className="text-muted-foreground">hack0.dev/org/</span>
              </InputGroupAddon>
              <InputGroupInput
                id="slug"
                value={slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                }}
                placeholder="mi-organizacion"
                required
              />
              <InputGroupAddon align="inline-end">
                {slugStatus === "checking" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {slugStatus === "available" && (
                  <Check className="h-4 w-4 text-emerald-500" />
                )}
                {slugStatus === "taken" && (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </InputGroupAddon>
            </InputGroup>
            {slugStatus === "taken" && (
              <p className="text-xs text-red-500">Esta URL ya está en uso</p>
            )}
          </Field>

          {/* Type + Website in same row */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="type">Tipo *</FieldLabel>
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
            </Field>

            <Field>
              <FieldLabel htmlFor="websiteUrl">Sitio web</FieldLabel>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Globe className="h-4 w-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="websiteUrl"
                  name="websiteUrl"
                  type="url"
                  placeholder="https://..."
                />
              </InputGroup>
            </Field>
          </div>

          {/* Description */}
          <Field>
            <FieldLabel htmlFor="description">Descripción</FieldLabel>
            <InputGroup>
              <InputGroupTextarea
                id="description"
                name="description"
                placeholder="Breve descripción de tu organización..."
                className="min-h-[80px]"
              />
            </InputGroup>
            <FieldDescription>
              Opcional. Aparecerá en tu perfil público.
            </FieldDescription>
          </Field>
        </FieldGroup>

        {/* Right column - Logo */}
        <Field>
          <FieldLabel>Logo</FieldLabel>
          <ImageUpload
            value={logoUrl}
            onChange={setLogoUrl}
            onRemove={() => setLogoUrl("")}
            endpoint="imageUploader"
            aspectRatio="square"
          />
          <FieldDescription className="text-center">
            Cuadrado, max 4MB
          </FieldDescription>
        </Field>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end mt-6 pt-4 border-t">
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
