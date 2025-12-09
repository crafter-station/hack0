"use client";

import { useState } from "react";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ORGANIZER_TYPE_LABELS, type Organization } from "@/lib/db/schema";
import { updateOrganizationById } from "@/lib/actions/organizations";
import { ImageUpload } from "@/components/ui/image-upload";
import { Loader2, Save } from "lucide-react";

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
        type: (formData.get("type") as string) || undefined,
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
      {/* Basic Info */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Información básica
        </h2>
        <div className="grid gap-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Nombre de la comunidad *
            </label>
            <Input
              id="name"
              name="name"
              defaultValue={organization.name}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="slug" className="text-sm font-medium">
              URL personalizada
            </label>
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
            <p className="text-xs text-muted-foreground">
              El slug no se puede cambiar
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Descripción
            </label>
            <Textarea
              id="description"
              name="description"
              defaultValue={organization.description || ""}
              placeholder="Breve descripción de tu comunidad..."
              className="min-h-20 resize-none"
            />
          </div>
        </div>
      </section>

      {/* Type */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Tipo de comunidad
        </h2>
        <div className="grid gap-4">
          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              Tipo
            </label>
            <SearchableSelect
              options={ORGANIZER_TYPE_OPTIONS}
              value={organization.type || "community"}
              onValueChange={(value) => {
                const typeInput = document.querySelector('input[name="type"]') as HTMLInputElement;
                if (typeInput) typeInput.value = value;
              }}
              placeholder="Selecciona un tipo"
              searchPlaceholder="Buscar tipo..."
              emptyMessage="No se encontró el tipo"
            />
            <input type="hidden" name="type" defaultValue={organization.type || "community"} />
          </div>
        </div>
      </section>

      {/* Links */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Enlaces
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
              defaultValue={organization.websiteUrl || ""}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Logo</label>
            <ImageUpload
              value={logoUrl}
              onChange={setLogoUrl}
              onRemove={() => setLogoUrl("")}
              endpoint="imageUploader"
              aspectRatio="square"
              className="max-w-[150px]"
            />
          </div>
        </div>
      </section>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-600">
            Comunidad actualizada correctamente
          </p>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t">
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
