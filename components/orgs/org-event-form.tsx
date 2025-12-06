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
import {
  EVENT_TYPE_OPTIONS,
  FORMAT_OPTIONS,
  SKILL_LEVEL_OPTIONS,
  COUNTRY_OPTIONS,
} from "@/lib/event-utils";
import { createEvent } from "@/lib/actions/hackathons";
import { ImageUpload } from "@/components/ui/image-upload";
import { Loader2, Send, Sparkles } from "lucide-react";

interface OrgEventFormProps {
  organizationId: string;
  organizationName: string;
}

export function OrgEventForm({
  organizationId,
  organizationName,
}: OrgEventFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJuniorFriendly, setIsJuniorFriendly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventImageUrl, setEventImageUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const result = await createEvent({
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      websiteUrl: formData.get("websiteUrl") as string,
      eventType: formData.get("eventType") as string,
      format: formData.get("format") as string,
      skillLevel: formData.get("skillLevel") as string,
      country: formData.get("country") as string,
      city: (formData.get("city") as string) || undefined,
      isJuniorFriendly,
      startDate: (formData.get("startDate") as string) || undefined,
      endDate: (formData.get("endDate") as string) || undefined,
      registrationDeadline:
        (formData.get("registrationDeadline") as string) || undefined,
      organizerName: organizationName,
      prizePool: formData.get("prizePool")
        ? Number(formData.get("prizePool"))
        : undefined,
      organizationId,
      eventImageUrl: eventImageUrl || undefined,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Error al crear el evento");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section: Información básica */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Información básica
        </h2>
        <div className="grid gap-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Nombre del evento *
            </label>
            <Input
              id="name"
              name="name"
              placeholder="ej. Hackathon IA Peru 2025"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Descripción
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder="Breve descripción del evento..."
              className="min-h-20 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="websiteUrl" className="text-sm font-medium">
              URL del evento *
            </label>
            <Input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              placeholder="https://..."
              required
            />
          </div>
        </div>
      </section>

      {/* Section: Imagen */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Imagen
        </h2>
        <div className="space-y-2">
          <label className="text-sm font-medium">Imagen del evento</label>
          <ImageUpload
            value={eventImageUrl}
            onChange={setEventImageUrl}
            onRemove={() => setEventImageUrl("")}
            endpoint="imageUploader"
            aspectRatio="square"
            className="max-w-[200px]"
          />
          <p className="text-xs text-muted-foreground">
            Cuadrada, max 4MB
          </p>
        </div>
      </section>

      {/* Section: Clasificación */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Clasificación
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="eventType" className="text-sm font-medium">
              Tipo de evento
            </label>
            <Select name="eventType" defaultValue="hackathon">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="format" className="text-sm font-medium">
              Formato
            </label>
            <Select name="format" defaultValue="virtual">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar formato" />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="skillLevel" className="text-sm font-medium">
              Nivel requerido
            </label>
            <Select name="skillLevel" defaultValue="all">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar nivel" />
              </SelectTrigger>
              <SelectContent>
                {SKILL_LEVEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="country" className="text-sm font-medium">
              País
            </label>
            <Select name="country" defaultValue="PE">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar país" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Junior friendly toggle */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Junior friendly</p>
              <p className="text-xs text-muted-foreground">
                Apto para principiantes sin experiencia
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isJuniorFriendly}
            onClick={() => setIsJuniorFriendly(!isJuniorFriendly)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              isJuniorFriendly ? "bg-foreground" : "bg-muted"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
                isJuniorFriendly ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Section: Fechas */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Fechas
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label htmlFor="startDate" className="text-sm font-medium">
              Fecha de inicio
            </label>
            <Input id="startDate" name="startDate" type="date" />
          </div>

          <div className="space-y-2">
            <label htmlFor="endDate" className="text-sm font-medium">
              Fecha de fin
            </label>
            <Input id="endDate" name="endDate" type="date" />
          </div>

          <div className="space-y-2">
            <label htmlFor="registrationDeadline" className="text-sm font-medium">
              Cierre de inscripción
            </label>
            <Input
              id="registrationDeadline"
              name="registrationDeadline"
              type="date"
            />
          </div>
        </div>
      </section>

      {/* Section: Ubicación y premios */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Ubicación y premios
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="city" className="text-sm font-medium">
              Ciudad
            </label>
            <Input
              id="city"
              name="city"
              placeholder="ej. Lima, Arequipa, Cusco"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="prizePool" className="text-sm font-medium">
              Premio (USD)
            </label>
            <Input
              id="prizePool"
              name="prizePool"
              type="number"
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Dejar en blanco si no hay premio
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
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        <Button type="submit" disabled={isSubmitting} className="sm:order-2">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Crear evento
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="sm:order-1"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
