"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ORGANIZER_TYPE_LABELS, type Organization } from "@/lib/db/schema";
import { updateOrganizationById } from "@/lib/actions/organizations";
import { ImageUpload } from "@/components/ui/image-upload";
import { Loader2, Save, Globe, Building2, Image as ImageIcon } from "lucide-react";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";

const ORGANIZER_TYPE_OPTIONS = Object.entries(ORGANIZER_TYPE_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  })
);

interface OrgSettingsFormProps {
  organization: Organization;
}

export function OrgSettingsForm({ organization }: OrgSettingsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logoUrl, setLogoUrl] = useState(organization.logoUrl || "");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    try {
      await updateOrganizationById(organization.id, {
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || undefined,
        type: (formData.get("type") as any) || undefined,
        websiteUrl: (formData.get("websiteUrl") as string) || undefined,
        logoUrl: logoUrl || undefined,
      });

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar la comunidad"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            ✓ Comunidad actualizada correctamente
          </p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        {/* Left column - Main fields */}
        <FieldGroup className="gap-8">
          <Field>
            <FieldLabel htmlFor="name">
              <Building2 className="h-4 w-4" />
              Nombre de la comunidad
            </FieldLabel>
            <Input
              id="name"
              name="name"
              defaultValue={organization.name}
              required
              placeholder="Ej: START Lima"
              className="text-base"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="slug">URL personalizada</FieldLabel>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                hack0.dev/c/
              </span>
              <Input
                id="slug"
                value={organization.slug}
                disabled
                className="flex-1 bg-muted"
              />
            </div>
            <FieldDescription>El slug no se puede cambiar</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Descripción</FieldLabel>
            <Textarea
              id="description"
              name="description"
              defaultValue={organization.description || ""}
              placeholder="Breve descripción de tu comunidad..."
              rows={4}
              className="resize-none"
            />
            <FieldDescription>
              Describe brevemente tu comunidad y su misión
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="type">
              <Building2 className="h-4 w-4" />
              Tipo de comunidad
            </FieldLabel>
            <SearchableSelect
              options={ORGANIZER_TYPE_OPTIONS}
              value={organization.type || "community"}
              onValueChange={(value) => {
                const typeInput = document.querySelector(
                  'input[name="type"]'
                ) as HTMLInputElement;
                if (typeInput) typeInput.value = value;
              }}
              placeholder="Selecciona un tipo"
              searchPlaceholder="Buscar tipo..."
              emptyMessage="No se encontró el tipo"
            />
            <input
              type="hidden"
              name="type"
              defaultValue={organization.type || "community"}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="websiteUrl">
              <Globe className="h-4 w-4" />
              Sitio web
            </FieldLabel>
            <Input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              defaultValue={organization.websiteUrl || ""}
              placeholder="https://ejemplo.com"
            />
          </Field>
        </FieldGroup>

        {/* Right column - Logo (sticky sidebar) */}
        <div className="lg:sticky lg:top-24 h-fit">
          <Field>
            <FieldLabel>
              <ImageIcon className="h-4 w-4" />
              Logo
            </FieldLabel>
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
      </div>

      {/* Sticky submit bar */}
      <div className="flex gap-3 justify-end sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg border">
        <Button type="submit" disabled={isSubmitting} className="min-w-32">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
